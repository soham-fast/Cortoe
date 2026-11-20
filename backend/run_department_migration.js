const mongoose = require("mongoose")
require("dotenv").config({ path: "backend/.env" })
const {
  APPROVED_DEPARTMENTS,
  DEPARTMENT_MAPPING,
  normalizeDepartment,
} = require("./config/departments")

async function migrate() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI not found in backend/.env")
  }

  console.log("Connecting to MongoDB Atlas...")
  await mongoose.connect(uri)
  console.log("Connected successfully.\n")

  const db = mongoose.connection.db
  const organisationsCol = db.collection("organisations")
  const departmentsCol = db.collection("departments")
  const usersCol = db.collection("users")
  const onboardingsCol = db.collection("corporateonboardings")
  const assessmentsCol = db.collection("assessments")
  const interventionSessionsCol = db.collection("interventionsessions")

  // Fetch all organisations
  const organisations = await organisationsCol.find({}).toArray()
  console.log(`Found ${organisations.length} organisations.`)

  // Step 1: Standardize departments per organisation
  console.log("\n==========================================")
  console.log("STEP 1: Standardizing 'departments' collection per Organisation")
  console.log("==========================================")

  for (const org of organisations) {
    const orgId = org.organisationId || String(org._id)
    const orgCode = org.organisationCode || org.code || "DEPT"
    const prefix = orgCode.slice(0, 4).toUpperCase()

    console.log(`\nProcessing Organisation: ${org.name || "Unknown"} (${orgId}, Code: ${orgCode})`)

    const orgFilter = {
      $or: [
        { organisationId: orgId },
        { organisationId: String(org._id) },
        ...(mongoose.isValidObjectId(org._id) ? [{ organisationId: org._id }] : []),
      ],
    }

    const existingDepts = await departmentsCol.find(orgFilter).toArray()
    console.log(`  Existing department documents in DB: ${existingDepts.length}`)

    // Calculate max sequence number
    let maxSeq = 0
    for (const d of existingDepts) {
      const match = (d.departmentId || "").match(/-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxSeq) maxSeq = num
      }
    }

    // Group existing by normalized department
    const groups = new Map()
    for (const approved of APPROVED_DEPARTMENTS) {
      groups.set(approved, [])
    }

    const unmapped = []
    for (const d of existingDepts) {
      const norm = normalizeDepartment(d.name)
      if (groups.has(norm)) {
        groups.get(norm).push(d)
      } else {
        unmapped.push(d)
      }
    }

    const finalDepts = []

    for (const approvedName of APPROVED_DEPARTMENTS) {
      const group = groups.get(approvedName) || []

      if (group.length > 0) {
        // Choose canonical: exact name first, or first doc
        let canonical = group.find((d) => d.name === approvedName && d.status === "Active")
        if (!canonical) {
          canonical = group.find((d) => d.name === approvedName) || group[0]
        }

        // Update canonical doc to exact approved name, active status, and string orgId
        if (canonical.name !== approvedName || canonical.status !== "Active" || canonical.organisationId !== orgId) {
          await departmentsCol.updateOne(
            { _id: canonical._id },
            { $set: { name: approvedName, status: "Active", organisationId: orgId, updatedAt: new Date() } }
          )
          console.log(`  Updated canonical department [${canonical.departmentId}]: '${canonical.name}' -> '${approvedName}'`)
        } else {
          console.log(`  Retained canonical department [${canonical.departmentId}]: '${approvedName}'`)
        }

        // Handle duplicates in this group
        const duplicates = group.filter((d) => String(d._id) !== String(canonical._id))
        for (const dup of duplicates) {
          console.log(`    Merging duplicate [${dup.departmentId}] ('${dup.name}') -> [${canonical.departmentId}] ('${approvedName}')`)
          // Remap users
          const uRes = await usersCol.updateMany(
            { departmentId: dup.departmentId },
            { $set: { departmentId: canonical.departmentId, department: approvedName } }
          )
          if (uRes.modifiedCount > 0) console.log(`      Remapped ${uRes.modifiedCount} users`)

          // Remap assessments
          const aRes = await assessmentsCol.updateMany(
            { departmentId: dup.departmentId },
            { $set: { departmentId: canonical.departmentId, department: approvedName } }
          )
          if (aRes.modifiedCount > 0) console.log(`      Remapped ${aRes.modifiedCount} assessments`)

          // Remap intervention sessions
          const iRes = await interventionSessionsCol.updateMany(
            { departmentId: dup.departmentId },
            { $set: { departmentId: canonical.departmentId } }
          )
          if (iRes.modifiedCount > 0) console.log(`      Remapped ${iRes.modifiedCount} intervention sessions`)

          // Delete duplicate
          await departmentsCol.deleteOne({ _id: dup._id })
        }

        finalDepts.push(canonical)
      } else {
        // Create missing approved department
        maxSeq++
        const seqStr = String(maxSeq).padStart(3, "0")
        const departmentId = `DEPT-${prefix}-${seqStr}`

        const newDoc = {
          departmentId,
          organisationId: orgId,
          name: approvedName,
          status: "Active",
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await departmentsCol.insertOne(newDoc)
        console.log(`  Created missing department [${departmentId}]: '${approvedName}'`)
        finalDepts.push(newDoc)
      }
    }

    // Remap any unmapped docs
    for (const doc of unmapped) {
      const targetApproved = normalizeDepartment(doc.name)
      const canonical = finalDepts.find((d) => d.name === targetApproved)
      if (canonical) {
        console.log(`  Remapping unmapped [${doc.departmentId}] ('${doc.name}') -> [${canonical.departmentId}] ('${targetApproved}')`)
        await usersCol.updateMany(
          { departmentId: doc.departmentId },
          { $set: { departmentId: canonical.departmentId, department: targetApproved } }
        )
        await assessmentsCol.updateMany(
          { departmentId: doc.departmentId },
          { $set: { departmentId: canonical.departmentId, department: targetApproved } }
        )
        await interventionSessionsCol.updateMany(
          { departmentId: doc.departmentId },
          { $set: { departmentId: canonical.departmentId } }
        )
      }
      await departmentsCol.deleteOne({ _id: doc._id })
    }
  }

  // Step 2: Global users cleanup
  console.log("\n==========================================")
  console.log("STEP 2: Normalizing 'users' collection")
  console.log("==========================================")

  const usersWithDept = await usersCol.find({ department: { $ne: null } }).toArray()
  let userUpdated = 0
  for (const u of usersWithDept) {
    const rawDept = u.department
    const norm = normalizeDepartment(rawDept)
    let needsUpdate = false
    const updateObj = {}

    if (rawDept !== norm) {
      updateObj.department = norm
      needsUpdate = true
    }

    if (u.organisationLink && u.organisationLink.department && u.organisationLink.department !== normalizeDepartment(u.organisationLink.department)) {
      updateObj["organisationLink.department"] = normalizeDepartment(u.organisationLink.department)
      needsUpdate = true
    }

    if (needsUpdate) {
      await usersCol.updateOne({ _id: u._id }, { $set: updateObj })
      userUpdated++
      console.log(`  User ${u.username || u.email || u._id}: '${rawDept}' -> '${norm}'`)
    }
  }
  console.log(`Total users updated: ${userUpdated}`)

  // Step 3: Global Corporate Onboardings cleanup
  console.log("\n==========================================")
  console.log("STEP 3: Normalizing 'corporateonboardings' collection")
  console.log("==========================================")

  const onbs = await onboardingsCol.find({ "participantProfile.D3": { $ne: null } }).toArray()
  let onbUpdated = 0
  for (const o of onbs) {
    const rawD3 = o.participantProfile?.D3
    const norm = normalizeDepartment(rawD3)
    if (rawD3 !== norm) {
      await onboardingsCol.updateOne(
        { _id: o._id },
        { $set: { "participantProfile.D3": norm } }
      )
      onbUpdated++
      console.log(`  Onboarding doc ${o._id}: D3 '${rawD3}' -> '${norm}'`)
    }
  }
  console.log(`Total onboarding docs updated: ${onbUpdated}`)

  // Step 4: Global Assessments cleanup
  console.log("\n==========================================")
  console.log("STEP 4: Normalizing 'assessments' collection")
  console.log("==========================================")

  const assessmentsWithDept = await assessmentsCol.find({ department: { $ne: null } }).toArray()
  let asmUpdated = 0
  for (const a of assessmentsWithDept) {
    const rawDept = a.department
    const norm = normalizeDepartment(rawDept)
    if (rawDept !== norm) {
      await assessmentsCol.updateOne(
        { _id: a._id },
        { $set: { department: norm } }
      )
      asmUpdated++
      console.log(`  Assessment doc ${a._id}: '${rawDept}' -> '${norm}'`)
    }
  }
  console.log(`Total assessments updated: ${asmUpdated}`)

  // Step 5: Verification & Summary
  console.log("\n==========================================")
  console.log("STEP 5: Verification & Final Statistics")
  console.log("==========================================")

  const finalDepartments = await departmentsCol.find({}).toArray()
  console.log(`Total department documents across all orgs: ${finalDepartments.length}`)

  const deptsByOrg = {}
  for (const d of finalDepartments) {
    const o = String(d.organisationId)
    if (!deptsByOrg[o]) deptsByOrg[o] = []
    deptsByOrg[o].push(d)
  }

  for (const [orgId, list] of Object.entries(deptsByOrg)) {
    console.log(`\nOrg [${orgId}] Departments (${list.length} total):`)
    for (const d of list) {
      console.log(`  - [${d.departmentId}] ${d.name} (${d.status})`)
    }
  }

  // Check for any legacy departments remaining anywhere
  const invalidDepts = await departmentsCol.find({ name: { $nin: APPROVED_DEPARTMENTS } }).toArray()
  console.log(`\nRemaining non-approved department documents in 'departments': ${invalidDepts.length}`)

  const invalidUsers = await usersCol.find({ department: { $nin: [...APPROVED_DEPARTMENTS, null] } }).toArray()
  console.log(`Remaining non-approved department names in 'users': ${invalidUsers.length}`)

  const invalidAsm = await assessmentsCol.find({ department: { $nin: [...APPROVED_DEPARTMENTS, null] } }).toArray()
  console.log(`Remaining non-approved department names in 'assessments': ${invalidAsm.length}`)

  const invalidOnb = await onboardingsCol.find({ "participantProfile.D3": { $nin: [...APPROVED_DEPARTMENTS, null] } }).toArray()
  console.log(`Remaining non-approved D3 values in 'corporateonboardings': ${invalidOnb.length}`)

  console.log("\n=== MIGRATION COMPLETED SUCCESSFULLY ===")
  await mongoose.disconnect()
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})

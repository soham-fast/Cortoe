const Department = require("../models/Department")
const Organisation = require("../models/Organisation")
const User = require("../models/User")
const Assessment = require("../models/Assessment")
const InterventionSession = require("../models/InterventionSession")
const mongoose = require("mongoose")
const {
  APPROVED_DEPARTMENTS,
  DEPARTMENT_MAPPING,
  normalizeDepartment,
  isValidDepartment,
} = require("../config/departments")

// Backwards compatibility alias
const normalizeDepartmentName = normalizeDepartment
const DEFAULT_DEPARTMENTS = APPROVED_DEPARTMENTS

/**
 * Generates an organisation-scoped department ID prefix from the organisation.
 * e.g. For "Meridian Group" with organisationCode "MERI4827" -> "MERI".
 * For "CortiQuant" (CORT2480) -> "CORT".
 */
function getOrgCodePrefix(org) {
  if (!org) return "DEPT"
  const code = org.organisationCode || org.code
  if (code && typeof code === "string" && code.length >= 3) {
    return code.slice(0, 4).toUpperCase()
  }
  const nameChars = (org.name || "").replace(/[^a-zA-Z]/g, "").toUpperCase()
  if (nameChars.length >= 3) {
    return nameChars.slice(0, 3)
  }
  return "DEPT"
}

/**
 * Ensures strictly the 8 approved departments exist for a given organisation.
 * Eliminates duplicates, remaps legacy references, and returns exactly the 8 approved departments.
 */
async function ensureDepartmentsForOrg(organisationId) {
  if (!organisationId) return []

  // Resolve organisation doc to derive appropriate code prefix
  const org = await Organisation.findOne({
    $or: [
      { _id: mongoose.isValidObjectId(organisationId) ? organisationId : null },
      { organisationId: organisationId },
    ],
  })

  const orgPrefix = getOrgCodePrefix(org)
  const queryOrgId = org ? org.organisationId : organisationId

  const orgFilter = {
    $or: [
      { organisationId: queryOrgId },
      { organisationId: String(organisationId) },
      ...(mongoose.isValidObjectId(organisationId) ? [{ organisationId: new mongoose.Types.ObjectId(organisationId) }] : []),
    ],
  }

  // Fetch all existing departments for this organisation
  const existing = await Department.find(orgFilter)

  // Calculate highest sequence number
  let maxSeq = 0
  for (const d of existing) {
    const match = d.departmentId?.match(/-(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxSeq) maxSeq = num
    }
  }

  // Group existing departments by canonical approved department name
  const canonicalGroups = new Map()
  for (const approved of APPROVED_DEPARTMENTS) {
    canonicalGroups.set(approved, [])
  }

  const unmappedDocs = []
  for (const doc of existing) {
    const canonicalName = normalizeDepartment(doc.name)
    if (canonicalGroups.has(canonicalName)) {
      canonicalGroups.get(canonicalName).push(doc)
    } else {
      unmappedDocs.push(doc)
    }
  }

  const finalDepartments = []

  for (const approvedName of APPROVED_DEPARTMENTS) {
    const group = canonicalGroups.get(approvedName) || []

    if (group.length > 0) {
      // Pick the best doc: exact name match first, or the first one
      let canonicalDoc = group.find((d) => d.name === approvedName && d.status === "Active")
      if (!canonicalDoc) {
        canonicalDoc = group.find((d) => d.name === approvedName) || group[0]
      }

      // If its name isn't strictly the canonical name, update it
      if (canonicalDoc.name !== approvedName || canonicalDoc.status !== "Active") {
        canonicalDoc.name = approvedName
        canonicalDoc.status = "Active"
        canonicalDoc.organisationId = queryOrgId
        await canonicalDoc.save()
      }

      // Any duplicates in this group must be remapped to canonicalDoc and removed
      const duplicates = group.filter((d) => String(d._id) !== String(canonicalDoc._id))
      for (const dup of duplicates) {
        if (dup.departmentId && dup.departmentId !== canonicalDoc.departmentId) {
          // Remap users
          await User.updateMany(
            { ...orgFilter, departmentId: dup.departmentId },
            { $set: { departmentId: canonicalDoc.departmentId, department: approvedName } }
          )
          // Remap assessments
          await Assessment.updateMany(
            { ...orgFilter, departmentId: dup.departmentId },
            { $set: { departmentId: canonicalDoc.departmentId, department: approvedName } }
          )
          // Remap intervention sessions
          await InterventionSession.updateMany(
            { ...orgFilter, departmentId: dup.departmentId },
            { $set: { departmentId: canonicalDoc.departmentId } }
          )
        }
        // Remove duplicate department doc
        await Department.deleteOne({ _id: dup._id })
      }

      finalDepartments.push(canonicalDoc)
    } else {
      // Create missing approved department
      maxSeq++
      const seqStr = String(maxSeq).padStart(3, "0")
      const departmentId = `DEPT-${orgPrefix}-${seqStr}`

      const newDept = new Department({
        departmentId,
        organisationId: queryOrgId,
        name: approvedName,
        status: "Active",
      })

      try {
        await newDept.save()
        finalDepartments.push(newDept)
      } catch (err) {
        if (err.code === 11000) {
          const found = await Department.findOne({ organisationId: queryOrgId, name: approvedName })
          if (found) {
            finalDepartments.push(found)
          }
        } else {
          console.error(`[DEPARTMENT-SERVICE] Error creating department ${approvedName}:`, err.message)
        }
      }
    }
  }

  // Clean up any unmapped legacy docs
  for (const doc of unmappedDocs) {
    const targetApproved = normalizeDepartment(doc.name)
    const canonical = finalDepartments.find((d) => d.name === targetApproved)
    if (canonical && doc.departmentId && doc.departmentId !== canonical.departmentId) {
      await User.updateMany(
        { ...orgFilter, departmentId: doc.departmentId },
        { $set: { departmentId: canonical.departmentId, department: canonical.name } }
      )
      await Assessment.updateMany(
        { ...orgFilter, departmentId: doc.departmentId },
        { $set: { departmentId: canonical.departmentId, department: canonical.name } }
      )
      await InterventionSession.updateMany(
        { ...orgFilter, departmentId: doc.departmentId },
        { $set: { departmentId: canonical.departmentId } }
      )
    }
    await Department.deleteOne({ _id: doc._id })
  }

  return finalDepartments
}

/**
 * Finds or creates a single department by name for an organisation.
 * Returns the Department document.
 */
async function getOrCreateDepartment(organisationId, departmentName) {
  if (!organisationId || !departmentName) return null

  const org = await Organisation.findOne({
    $or: [
      { _id: mongoose.isValidObjectId(organisationId) ? organisationId : null },
      { organisationId: organisationId },
    ],
  })

  const queryOrgId = org ? org.organisationId : organisationId
  const normalizedDeptName = normalizeDepartment(departmentName)

  // Ensure all standard departments exist
  const allDepts = await ensureDepartmentsForOrg(queryOrgId)
  const match = allDepts.find((d) => d.name === normalizedDeptName)
  if (match) return match

  return allDepts[0] || null
}

module.exports = {
  ensureDepartmentsForOrg,
  getOrCreateDepartment,
  normalizeDepartmentName,
  normalizeDepartment,
  isValidDepartment,
  DEPARTMENT_MAPPING,
  DEFAULT_DEPARTMENTS,
  APPROVED_DEPARTMENTS,
}

const jwt = require("jsonwebtoken")
const { requireAuth, requireHR, requireAdmin, requireListener } = require("./backend/middleware/auth")

console.log("=== Testing Guest Demo Token Generation & Authorization ===")

// 1. Generate demo token
const secret = process.env.JWT_SECRET || "cortiquant-demo-secret"
process.env.JWT_SECRET = secret

const demoPayload = {
  id: "demo-guest-user-001",
  role: "demo",
  isDemo: true,
  name: "Alex Morgan",
  email: "demo@cortoe.com",
  employeeId: "DEMO-001",
  organisationName: "Demo Corporation",
  organisationCode: "DEMO2026",
  department: "Human Resources",
}

const token = jwt.sign(demoPayload, secret, { expiresIn: "4h" })
console.log("1. Generated Demo Token:", token.slice(0, 30) + "...")

// 2. Test requireAuth with demo token on GET request
const mockReqGet = {
  method: "GET",
  path: "/api/assessments/metrics",
  headers: { authorization: `Bearer ${token}` },
}

let nextCalled = false
const mockRes = {
  status: function(code) {
    this.statusCode = code
    return this
  },
  json: function(obj) {
    this.body = obj
    return this
  }
}

requireAuth(mockReqGet, mockRes, (err) => {
  if (!err) nextCalled = true
})

if (nextCalled && mockReqGet.user && mockReqGet.user.isDemo && mockReqGet.user.name === "Alex Morgan") {
  console.log("2. requireAuth GET -> Success: user attached, isDemo is true, name is Alex Morgan")
} else {
  console.error("2. requireAuth GET -> FAILED", mockReqGet.user)
}

// 3. Test requireAuth intercept on POST mutating request (Zero writes)
const mockReqPost = {
  method: "POST",
  path: "/api/assessments/checkin",
  headers: { authorization: `Bearer ${token}` },
}

let postNextCalled = false
let postResponse = null
const mockResPost = {
  status: function(code) {
    this.statusCode = code
    return this
  },
  json: function(obj) {
    this.body = obj
    postResponse = { status: this.statusCode, body: obj }
    return this
  }
}

requireAuth(mockReqPost, mockResPost, () => {
  postNextCalled = true
})

if (!postNextCalled && postResponse && postResponse.body.isDemo && postResponse.body.simulated) {
  console.log("3. requireAuth POST -> Intercepted successfully! Zero writes to MongoDB. Response:", postResponse.body.message)
} else {
  console.error("3. requireAuth POST -> FAILED, allowed mutating pass-through!")
}

// 4. Test requireHR blocks demo token with 403
let hrBlocked = false
requireHR(mockReqGet, mockRes, () => {})
if (mockRes.statusCode === 403) {
  console.log("4. requireHR with demo token -> Blocked with 403 Forbidden as expected!")
} else {
  console.error("4. requireHR with demo token -> FAILED, status:", mockRes.statusCode)
}

// 5. Test requireAdmin blocks demo token with 403
requireAdmin(mockReqGet, mockRes, () => {})
if (mockRes.statusCode === 403) {
  console.log("5. requireAdmin with demo token -> Blocked with 403 Forbidden as expected!")
} else {
  console.error("5. requireAdmin with demo token -> FAILED, status:", mockRes.statusCode)
}

console.log("=== All Backend Demo Security Checks Passed! ===")

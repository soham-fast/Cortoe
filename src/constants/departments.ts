/**
 * Single Source of Truth for Approved Cortoe Departments
 */

export const APPROVED_DEPARTMENTS = [
  "Tech & Product",
  "People & Support",
  "Sales & Marketing",
  "Services & Delivery",
  "Research & Innovation",
  "Operation & Admin",
  "Finance & Legal",
  "Other",
] as const

export type ApprovedDepartment = typeof APPROVED_DEPARTMENTS[number]

/**
 * Mapping from legacy / alternative department names to the 8 approved departments
 */
export const DEPARTMENT_MAPPING: Record<string, ApprovedDepartment> = {
  // Legacy department names
  "Engineering": "Tech & Product",
  "Customer Support": "People & Support",
  "HR": "People & Support",
  "Human Resources": "People & Support",
  "Sales": "Sales & Marketing",
  "Marketing": "Sales & Marketing",
  "Operations": "Operation & Admin",
  "Finance": "Finance & Legal",
  "Legal": "Finance & Legal",

  // Formatting / variant differences
  "Operations & Admin": "Operation & Admin",
  "Operations and Admin": "Operation & Admin",
  "Operation and Admin": "Operation & Admin",
  "Finance and Legal": "Finance & Legal",
  "Services / Delivery": "Services & Delivery",
  "Services and Delivery": "Services & Delivery",
  "Tech and Product": "Tech & Product",
  "People and Support": "People & Support",
  "Sales and Marketing": "Sales & Marketing",
  "Research and Innovation": "Research & Innovation",
}

/**
 * Normalizes any department string to one of the 8 approved departments.
 * Defaults to "Other" if unmapped.
 */
export function normalizeDepartment(dept?: string | null): ApprovedDepartment {
  if (!dept || typeof dept !== "string") return "Other"
  const trimmed = dept.trim()
  if (APPROVED_DEPARTMENTS.includes(trimmed as ApprovedDepartment)) {
    return trimmed as ApprovedDepartment
  }
  const lower = trimmed.toLowerCase()
  for (const [legacy, canonical] of Object.entries(DEPARTMENT_MAPPING)) {
    if (legacy.toLowerCase() === lower) {
      return canonical
    }
  }
  return "Other"
}

export function isValidDepartment(dept: string): dept is ApprovedDepartment {
  return APPROVED_DEPARTMENTS.includes(dept as ApprovedDepartment)
}

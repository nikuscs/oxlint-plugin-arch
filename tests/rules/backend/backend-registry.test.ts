import { describe, it } from 'vitest'
import { backendRegistry } from '../../../src/rules/backend/backend-registry.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/backend-registry', () => {
  it.each([
    {
      name: 'registered service directory',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/billing/billing.service.ts': 'export const billing = {}' },
      code: 'export const services = { billing: makeBillingService }',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services' },
    },
    {
      name: 'a plural key registers the service',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/category/category.service.ts': 'export const category = {}' },
      code: 'export const services = { categories: makeCategoryService }',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services' },
    },
    {
      name: 'hyphenated domains use camelCase keys',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/user-profile/user-profile.service.ts': 'export const profile = {}' },
      code: "export const services = { 'userProfile': makeProfileService }",
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services' },
    },
    {
      name: 'factory return object registers services',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/billing/billing.service.ts': 'export const billing = {}' },
      code: 'export function makeServices() { return { billing: makeBillingService } }',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services', object: 'makeServices' },
    },
    {
      name: 'concise factory and satisfies wrapper retain keys',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/billing/billing.service.ts': 'export const billing = {}' },
      code: 'export const makeServices = (() => ({ billing: makeBillingService })) satisfies Factory',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services', object: 'makeServices' },
    },
    {
      name: 'skipped folders do not require service files',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/database/connection.ts': 'export const connection = {}' },
      code: 'export const services = {}',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services', skip: ['database'] },
    },
    {
      name: 'files directly under services are ignored',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/shared.ts': 'export const shared = {}' },
      code: 'export const services = {}',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services' },
    },
    {
      name: 'non-registry files are ignored',
      filename: 'src/other.ts',
      files: { 'src/services/billing/billing.service.ts': 'export const billing = {}' },
      code: 'export const services = {}',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services' },
    },
    {
      name: 'unregistered service reports on the registry',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/billing/billing.service.ts': 'export const billing = {}' },
      code: 'export const services = { order: makeOrderService }',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services' },
      errors: ['unregistered'],
    },
    {
      name: 'domain missing its service file',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/billing/billing.utils.ts': 'export const billing = {}' },
      code: 'export const services = { billing: makeBillingService }',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services' },
      errors: ['missing'],
    },
    {
      name: 'object selection excludes unrelated top-level objects',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/billing/billing.service.ts': 'export const billing = {}' },
      code: 'const unrelated = { billing: makeBillingService }; export const services = {}',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services', object: 'services' },
      errors: ['unregistered'],
    },
    {
      name: 'nested object keys do not register services',
      filename: 'src/core/core.services.ts',
      files: { 'src/services/billing/billing.service.ts': 'export const billing = {}' },
      code: 'export const services = { nested: { billing: makeBillingService } }',
      options: { registry: '<root>/src/core/core.services.ts', services: '<root>/src/services' },
      errors: ['unregistered'],
    },
  ])('$name', (row) => testerRun(backendRegistry, row))
})

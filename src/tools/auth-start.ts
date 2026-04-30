import { z } from 'zod'
import {
  type DeviceCodeResponse,
  issueDeviceCode as defaultIssueDeviceCode,
} from '../auth/device-flow'

export const authStartInput = z.object({}).strict()
export type AuthStartInput = z.infer<typeof authStartInput>

export type AuthStartOutput = DeviceCodeResponse

export type AuthStartDeps = {
  issueDeviceCode: () => Promise<DeviceCodeResponse>
}

const defaultDeps: AuthStartDeps = {
  issueDeviceCode: defaultIssueDeviceCode,
}

export const authStart = async (
  _input: AuthStartInput,
  deps: AuthStartDeps = defaultDeps
): Promise<AuthStartOutput> => deps.issueDeviceCode()

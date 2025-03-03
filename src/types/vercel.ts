import { VercelRequest, VercelResponse } from "@vercel/node";
import { AuthenticatedUser } from "./auth";

export interface AuthenticatedVercelRequest extends VercelRequest {
  user?: AuthenticatedUser;
}

export type VercelLambdaResponse = VercelResponse;

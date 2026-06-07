"use server";

import { revalidatePath } from "next/cache";
import { approveBrandLogo } from "../../../lib/brand-assets";
import {
  approvePrototypeRender,
  enqueuePrototypeRerender,
  rejectPrototypeRender,
  switchPrototypeTemplate,
} from "../../../lib/prototype-studio";

const prototypeStudioPath = "/app/prototype-studio";

export async function approvePrototypeLogoAction(formData: FormData) {
  await approveBrandLogo(String(formData.get("id") || ""), String(formData.get("organizationId") || "") || null);
  revalidatePath(prototypeStudioPath);
  revalidatePath("/app/brand-assets");
}

export async function approvePrototypeRenderAction(formData: FormData) {
  await approvePrototypeRender(String(formData.get("id") || ""));
  revalidatePath(prototypeStudioPath);
  revalidatePath("/app/offers");
}

export async function rejectPrototypeRenderAction(formData: FormData) {
  await rejectPrototypeRender(String(formData.get("id") || ""));
  revalidatePath(prototypeStudioPath);
  revalidatePath("/app/offers");
}

export async function switchPrototypeTemplateAction(formData: FormData) {
  await switchPrototypeTemplate(String(formData.get("briefId") || ""), String(formData.get("templateId") || ""));
  revalidatePath(prototypeStudioPath);
}

export async function enqueuePrototypeRerenderAction(formData: FormData) {
  await enqueuePrototypeRerender(String(formData.get("briefId") || ""));
  revalidatePath(prototypeStudioPath);
}

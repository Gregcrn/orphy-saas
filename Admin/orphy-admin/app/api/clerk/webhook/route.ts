import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  // Handle events
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;

    if (!primaryEmail) {
      return new Response("No email address found", { status: 400 });
    }

    await convex.mutation(api.users.createUser, {
      clerkId: id,
      email: primaryEmail,
      firstName: first_name ?? undefined,
      lastName: last_name ?? undefined,
      imageUrl: image_url ?? undefined,
    });

    console.log(`User created: ${id}`);
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;

    await convex.mutation(api.users.updateUser, {
      clerkId: id,
      email: primaryEmail,
      firstName: first_name ?? undefined,
      lastName: last_name ?? undefined,
      imageUrl: image_url ?? undefined,
    });

    console.log(`User updated: ${id}`);
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (id) {
      await convex.mutation(api.users.deleteUser, {
        clerkId: id,
      });

      console.log(`User deleted: ${id}`);
    }
  }

  return new Response("OK", { status: 200 });
}

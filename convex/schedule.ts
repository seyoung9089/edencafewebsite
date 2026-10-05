import { action } from './_generated/server'
import { getCurrentPickupSlot } from './pickupSchedule'

// Actions are never cached, so this always reflects the server's current
// time. The client shows this slot, and orders.create re-checks it, so a
// customer with a wrong device clock still gets the correct pickup day.
export const currentSlot = action({
  args: {},
  handler: async () => getCurrentPickupSlot(Date.now()),
})

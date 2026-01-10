/**
 * 🔒 CHECKOUT CANCEL LAYOUT - UNKILLABLE
 * 
 * This layout ensures the cancel page ALWAYS renders:
 * - force-dynamic prevents edge pre-rendering
 * - No auth checks that could cause hydration races
 */

export const dynamic = 'force-dynamic';

export default function CheckoutCancelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

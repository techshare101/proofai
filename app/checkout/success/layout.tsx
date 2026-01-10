/**
 * 🔒 CHECKOUT SUCCESS LAYOUT - UNKILLABLE
 * 
 * This layout ensures the success page ALWAYS renders:
 * - force-dynamic prevents edge pre-rendering
 * - No auth checks that could cause hydration races
 * - No parent layout interference
 */

export const dynamic = 'force-dynamic';

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

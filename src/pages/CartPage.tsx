import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CalendarDays, Gift, ShoppingCart, Trash2, UsersRound } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useGames } from "@/hooks/use-games";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { PriceTag } from "@/components/ui/price-tag";
import { ChipInGifting } from "@/components/cart/ChipInGifting";
import { SavedCarts } from "@/components/cart/SavedCarts";
import { toast } from "@/stores/toast-store";
import { ROUTES } from "@/lib/routes";
import { formatPrice } from "@/lib/utils";

export function CartPage() {
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const updateGift = useCartStore((s) => s.updateGift);
  const updateFamilyApproval = useCartStore((s) => s.updateFamilyApproval);
  const { data: games } = useGames();
  const navigate = useNavigate();

  const hasSubscription = items.some(i => i.gameId === "plus-sub");
  
  const baseList = (games ?? [])
    .map((g) => {
      const cartItem = items.find((i) => i.gameId === g.id);
      if (!cartItem) return null;
      return {
        id: g.id,
        name: g.name,
        price: g.price,
        developer: g.developer,
        capsuleUrl: g.capsuleUrl,
        cartItem,
      };
    })
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const list = hasSubscription 
    ? [...baseList, {
        id: "plus-sub",
        name: "Dreamworks+ (1 Month)",
        price: { final: 1499, base: 1499, isFree: false, currency: "USD" as const, discountPct: 0, discountEndsAt: null },
        developer: "Dreamworks",
        capsuleUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=320&h=160",
        cartItem: items.find((i) => i.gameId === "plus-sub"),
      }]
    : baseList;

  const subtotal = list.reduce((acc, g) => acc + g.price.final, 0);
  const giftCount = items.filter((item) => item.asGift && item.gameId !== "plus-sub").length;
  const approvalCount = items.filter(
    (item) => item.familyApproval?.required && item.gameId !== "plus-sub",
  ).length;
  const today = new Date().toISOString().slice(0, 10);

  if (list.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Add a game from the store to begin checkout."
        action={
          <Link
            to={ROUTES.store}
            className="rounded-xl bg-acid px-4 py-2 text-[13px] font-semibold text-background"
          >
            Browse the store
          </Link>
        }
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-5">
        Shopping cart
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-2">
          {list.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-separator bg-card p-3"
            >
              <div className="flex items-center gap-4">
                <img loading="lazy" decoding="async" src={g.capsuleUrl} alt="" referrerPolicy="no-referrer" className="h-16 w-32 rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                  {g.id === "plus-sub" ? (
                    <p className="text-[13px] font-semibold text-brand-plus truncate">{g.name}</p>
                  ) : (
                    <Link to={ROUTES.gameDetail(g.id)} className="hover:underline">
                      <p className="text-[13px] font-semibold text-foreground truncate">{g.name}</p>
                    </Link>
                  )}
                  <p className="mt-1 text-[11px] text-muted/60">{g.developer}</p>
                </div>
                <PriceTag price={g.price} size="md" />
                <button
                  onClick={() => {
                    void remove(g.id);
                    toast.info(`Removed “${g.name}”`, {
                      action: {
                        label: "Undo",
                        onClick: () => {
                          void useCartStore.getState().add(g.id);
                        },
                      },
                    });
                  }}
                  className="rounded-md p-2 text-muted/40 hover:bg-input hover:text-red"
                  aria-label={`Remove ${g.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {g.id !== "plus-sub" && g.cartItem && (
                <div className="mt-3 grid gap-3 border-t border-separator pt-3 md:grid-cols-[180px_1fr]">
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateGift(g.id, {
                          asGift: !g.cartItem?.asGift,
                          recipient: g.cartItem?.giftRecipient,
                          scheduledDeliveryAt: g.cartItem?.scheduledDeliveryAt,
                        })
                      }
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12px] ${
                        g.cartItem.asGift
                          ? "border-acid/40 bg-acid/10 text-foreground"
                          : "border-separator bg-input/50 text-muted/70"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Gift className="h-3.5 w-3.5" /> Send as gift
                      </span>
                      <span>{g.cartItem.asGift ? "On" : "Off"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateFamilyApproval(g.id, {
                          required: !g.cartItem?.familyApproval?.required,
                          status: !g.cartItem?.familyApproval?.required ? "pending" : "not_required",
                          requestedBy: "Child account",
                          guardianName: "Family organizer",
                        })
                      }
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[12px] ${
                        g.cartItem.familyApproval?.required
                          ? "border-acid/30 bg-acid/5 text-foreground"
                          : "border-separator bg-input/50 text-muted/70"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <UsersRound className="h-3.5 w-3.5" /> Family approval
                      </span>
                      <span>{g.cartItem.familyApproval?.required ? "Needed" : "Off"}</span>
                    </button>
                  </div>

                  {g.cartItem.asGift ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        aria-label={`${g.name} gift recipient name`}
                        placeholder="Recipient name"
                        value={g.cartItem.giftRecipient?.name ?? ""}
                        onChange={(event) =>
                          updateGift(g.id, {
                            asGift: true,
                            recipient: {
                              ...(g.cartItem?.giftRecipient ?? { name: "" }),
                              name: event.target.value,
                            },
                            scheduledDeliveryAt: g.cartItem?.scheduledDeliveryAt,
                          })
                        }
                      />
                      <Input
                        aria-label={`${g.name} gift recipient email`}
                        placeholder="Email"
                        type="email"
                        value={g.cartItem.giftRecipient?.email ?? ""}
                        onChange={(event) =>
                          updateGift(g.id, {
                            asGift: true,
                            recipient: {
                              ...(g.cartItem?.giftRecipient ?? { name: "" }),
                              email: event.target.value,
                            },
                            scheduledDeliveryAt: g.cartItem?.scheduledDeliveryAt,
                          })
                        }
                      />
                      <Input
                        aria-label={`${g.name} friend id`}
                        placeholder="Friend ID"
                        value={g.cartItem.giftRecipient?.friendId ?? ""}
                        onChange={(event) =>
                          updateGift(g.id, {
                            asGift: true,
                            recipient: {
                              ...(g.cartItem?.giftRecipient ?? { name: "" }),
                              friendId: event.target.value,
                            },
                            scheduledDeliveryAt: g.cartItem?.scheduledDeliveryAt,
                          })
                        }
                      />
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/40" />
                        <Input
                          aria-label={`${g.name} scheduled delivery date`}
                          className="pl-9"
                          type="date"
                          min={today}
                          value={g.cartItem.scheduledDeliveryAt?.slice(0, 10) ?? ""}
                          onChange={(event) =>
                            updateGift(g.id, {
                              asGift: true,
                              recipient: g.cartItem?.giftRecipient,
                              scheduledDeliveryAt: event.target.value
                                ? new Date(`${event.target.value}T12:00:00.000Z`).toISOString()
                                : undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="self-center text-[12px] text-muted/55">
                      This copy will be delivered to your account unless you mark it as a gift.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <aside className="rounded-xl border border-separator bg-card p-4 space-y-3 h-fit sticky top-4">
          <p className="text-[12px] uppercase tracking-widest text-muted/60">Summary</p>
          <div className="flex items-center justify-between text-[13px] text-foreground/80">
            <span>Subtotal</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-[12px] text-muted/60">
            <span>Estimated tax</span>
            <span>—</span>
          </div>
          {(giftCount > 0 || approvalCount > 0) && (
            <div className="rounded-lg border border-separator bg-input/40 p-3 text-[11px] text-muted/70">
              {giftCount > 0 && <p>{giftCount} gift {giftCount === 1 ? "recipient" : "recipients"} to review</p>}
              {approvalCount > 0 && <p>{approvalCount} item{approvalCount === 1 ? "" : "s"} need family approval</p>}
            </div>
          )}
          <div className="border-t border-separator pt-3 flex items-center justify-between text-[14px] font-semibold text-foreground">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="pt-2">
            <ChipInGifting totalCents={subtotal} />
          </div>
          <button
            onClick={() => navigate(ROUTES.checkout)}
            className="w-full rounded-xl bg-acid py-2.5 text-[13px] font-semibold text-background hover:brightness-110"
          >
            Continue to checkout
          </button>
        </aside>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="hidden lg:block" />
        <SavedCarts />
      </div>
    </motion.div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, Clock3, Gift, Loader2, ShieldCheck, UsersRound, XCircle } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useLibraryStore } from "@/stores/library-store";
import { useAuthStore } from "@/stores/auth-store";
import { useGiftRecipientsStore } from "@/stores/gift-recipients-store";
import { useGames } from "@/hooks/use-games";
import { useCountries, resolveLabel } from "@/hooks/use-config";
import { placeMockOrder } from "@/lib/api/orders";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/routes";
import { toast } from "@/stores/toast-store";
import { formatPrice } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import type { CartItem, FamilyApprovalMetadata, GameId } from "@/lib/types";

interface Form {
  name: string;
  card: string;
  expiry: string;
  cvc: string;
  country: string;
}
type Errors = Partial<Record<keyof Form, string>>;
type ApprovalStatus = FamilyApprovalMetadata["status"];

export function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const updateGift = useCartStore((s) => s.updateGift);
  const savedRecipients = useGiftRecipientsStore((s) => s.recipients);
  const addRecipient = useGiftRecipientsStore((s) => s.add);
  const addToLibrary = useLibraryStore((s) => s.addFromPurchase);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const profile = useAuthStore((s) => s.profile);
  const { data: games } = useGames();
  
  const hasSubscription = useMemo(() => items.some((i) => i.gameId === "plus-sub"), [items]);

  const baseList = useMemo(
    () =>
      (games ?? [])
        .map((g) => {
          const cartItem = items.find((i) => i.gameId === g.id);
          if (!cartItem) return null;
          return {
            id: g.id,
            name: g.name,
            price: g.price,
            cartItem,
          };
        })
        .filter((g): g is NonNullable<typeof g> => Boolean(g)),
    [games, items],
  );

  const list = useMemo(
    () =>
      hasSubscription
        ? [
            ...baseList,
            {
              id: "plus-sub",
              name: "Dreamworks+ (1 Month)",
              price: { final: 1499 },
              cartItem: items.find((i) => i.gameId === "plus-sub"),
            },
          ]
        : baseList,
    [hasSubscription, baseList, items],
  );

  const { subtotal, tax, total } = useMemo(() => {
    const sub = list.reduce((acc, g) => acc + g.price.final, 0);
    const t = Math.round(sub * 0.08);
    return { subtotal: sub, tax: t, total: sub + t };
  }, [list]);
  const giftItems = useMemo(
    () => baseList.filter((item) => item.cartItem.asGift),
    [baseList],
  );
  const approvalItems = useMemo(
    () => baseList.filter((item) => item.cartItem.familyApproval?.required),
    [baseList],
  );

  const countries = useCountries();
  const [form, setForm] = useState<Form>({
    name: "",
    card: "",
    expiry: "",
    cvc: "",
    // ISO-3166 alpha-2; resolved label is rendered next to the dropdown.
    country: "US",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [approvalStatuses, setApprovalStatuses] = useState<Record<GameId, ApprovalStatus>>(() =>
    Object.fromEntries(
      items
        .filter((item) => item.familyApproval?.required)
        .map((item) => [item.gameId, item.familyApproval?.status ?? "pending"]),
    ),
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (list.length === 0) {
    return (
      <EmptyState
        title="Nothing to check out"
        description="Add something to your cart first."
        action={
          <button
            onClick={() => navigate(ROUTES.store)}
            className="rounded-xl bg-acid px-4 py-2 text-[13px] font-semibold text-background"
          >
            Browse the store
          </button>
        }
      />
    );
  }

  const update = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const formatCard = (raw: string) =>
    raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 4);
    if (d.length < 3) return d;
    return `${d.slice(0, 2)} / ${d.slice(2)}`;
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "Required.";
    const digits = form.card.replace(/\s/g, "");
    if (digits.length < 13 || digits.length > 19) e.card = "Card number looks off.";
    if (!/^\d{2}\s\/\s\d{2}$/.test(form.expiry)) e.expiry = "MM / YY";
    else {
      const [mm, yy] = form.expiry.split(" / ").map((x) => parseInt(x, 10));
      if (mm < 1 || mm > 12) e.expiry = "Invalid month.";
      else if (yy < 26 || yy > 40) e.expiry = "Card expired.";
    }
    if (!/^\d{3,4}$/.test(form.cvc)) e.cvc = "3–4 digits.";
    if (!form.country) e.country = "Required.";
    setErrors(e);
    if (Object.keys(e).length > 0) return false;

    const incompleteGift = items.find(
      (item) =>
        item.asGift &&
        item.gameId !== "plus-sub" &&
        (!item.giftRecipient?.name.trim() ||
          !(item.giftRecipient.email?.trim() || item.giftRecipient.friendId?.trim())),
    );
    if (incompleteGift) {
      toast.error("Every gift needs a recipient name and email or friend ID.");
      return false;
    }
    return true;
  };

  const approvalFor = (item: CartItem): FamilyApprovalMetadata | undefined => {
    if (!item.familyApproval?.required) return item.familyApproval;
    const status = approvalStatuses[item.gameId] ?? item.familyApproval.status ?? "pending";
    return {
      ...item.familyApproval,
      required: true,
      status,
      guardianName: item.familyApproval.guardianName ?? "Family organizer",
      requestedBy: item.familyApproval.requestedBy ?? profile?.displayName ?? "Child account",
      decidedAt:
        status === "approved" || status === "denied"
          ? item.familyApproval.decidedAt ?? new Date().toISOString()
          : undefined,
      note:
        status === "approved"
          ? "Mock guardian approved this purchase."
          : status === "denied"
            ? "Mock guardian denied this purchase."
            : "Waiting for mock guardian approval.",
    };
  };

  const itemsForOrder = (): CartItem[] =>
    items.map((item) => ({
      ...item,
      familyApproval: approvalFor(item),
    }));

  const buyerLibraryIdsFrom = (orderedItems: CartItem[]) =>
    orderedItems
      .filter((item) => {
        if (item.gameId === "plus-sub" || item.asGift) return false;
        const status = item.familyApproval?.status;
        return status !== "pending" && status !== "denied";
      })
      .map((item) => item.gameId);

  const placeOrder = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (!profile) {
      toast.error("Sign in again before checking out.");
      return;
    }
    setLoading(true);
    try {
      const orderedItems = itemsForOrder();
      const result = await placeMockOrder({
        items: orderedItems,
        games: games ?? [],
        profile,
        country: form.country,
        includeSubscription: hasSubscription,
      });
      if (hasSubscription) {
        updateProfile({ isSubscribed: true });
      }

      // Persist any new gift recipients so they appear as chips next checkout.
      for (const item of orderedItems) {
        if (item.asGift && item.giftRecipient && item.giftRecipient.name.trim()) {
          await addRecipient(item.giftRecipient);
        }
      }

      const gameIds = buyerLibraryIdsFrom(orderedItems);
      if (gameIds.length > 0) addToLibrary(gameIds, result.order.id);
      clear();
      toast.success(
        hasSubscription
          ? `Welcome to Dreamworks+! Receipt ${result.order.receiptNumber}`
          : `Order placed · ${result.order.receiptNumber}`,
      );
      if (hasSubscription && orderedItems.every((item) => item.gameId === "plus-sub")) {
        navigate(ROUTES.plus);
      } else {
        navigate(ROUTES.order(result.order.id));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Order failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
      <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-5">
        {hasSubscription ? "Upgrade & Checkout" : "Checkout"}
      </h1>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-separator bg-card p-6 space-y-5">
        <Section title="Billing">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cardholder name" error={errors.name} colSpan={2}>
              <Input
                placeholder="As it appears on the card"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                autoComplete="cc-name"
              />
            </Field>
            <Field label="Card number" error={errors.card} colSpan={2}>
              <Input
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                value={form.card}
                onChange={(e) => update("card", formatCard(e.target.value))}
                autoComplete="cc-number"
              />
            </Field>
            <Field label="Expiry" error={errors.expiry}>
              <Input
                placeholder="MM / YY"
                inputMode="numeric"
                value={form.expiry}
                onChange={(e) => update("expiry", formatExpiry(e.target.value))}
                autoComplete="cc-exp"
              />
            </Field>
            <Field label="CVC" error={errors.cvc}>
              <Input
                placeholder="123"
                inputMode="numeric"
                value={form.cvc}
                onChange={(e) => update("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                autoComplete="cc-csc"
              />
            </Field>
            <Field label="Country / region" error={errors.country} colSpan={2}>
              <select
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                className="w-full rounded-xl border border-separator bg-input px-3 py-2 text-[13px] text-foreground"
                disabled={countries.isLoading}
              >
                {(countries.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {resolveLabel(c.labels)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {giftItems.length > 0 && (
          <Section title="Gift recipients">
            <div className="space-y-3">
              {giftItems.map((g) => (
                <div key={g.id} className="rounded-xl border border-separator bg-input/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[13px] font-semibold text-foreground">
                      {g.name}
                    </p>
                    <Gift className="h-4 w-4 shrink-0 text-acid" />
                  </div>
                  {savedRecipients.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {savedRecipients.map((recipient) => (
                        <button
                          key={`${g.id}:${recipient.friendId ?? recipient.email}`}
                          type="button"
                          onClick={() =>
                            updateGift(g.id, {
                              asGift: true,
                              recipient,
                              scheduledDeliveryAt: g.cartItem.scheduledDeliveryAt,
                            })
                          }
                          className="rounded-lg border border-separator bg-card px-2.5 py-1.5 text-[11px] text-foreground/80 hover:border-acid/35 hover:text-acid"
                        >
                          {recipient.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <Input
                      aria-label={`${g.name} recipient name`}
                      placeholder="Recipient name"
                      value={g.cartItem.giftRecipient?.name ?? ""}
                      onChange={(event) =>
                        updateGift(g.id, {
                          asGift: true,
                          recipient: {
                            ...(g.cartItem.giftRecipient ?? { name: "" }),
                            name: event.target.value,
                          },
                          scheduledDeliveryAt: g.cartItem.scheduledDeliveryAt,
                        })
                      }
                    />
                    <Input
                      aria-label={`${g.name} recipient email`}
                      placeholder="Email"
                      type="email"
                      value={g.cartItem.giftRecipient?.email ?? ""}
                      onChange={(event) =>
                        updateGift(g.id, {
                          asGift: true,
                          recipient: {
                            ...(g.cartItem.giftRecipient ?? { name: "" }),
                            email: event.target.value,
                          },
                          scheduledDeliveryAt: g.cartItem.scheduledDeliveryAt,
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
                            ...(g.cartItem.giftRecipient ?? { name: "" }),
                            friendId: event.target.value,
                          },
                          scheduledDeliveryAt: g.cartItem.scheduledDeliveryAt,
                        })
                      }
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted/55">
                    {g.cartItem.scheduledDeliveryAt
                      ? `Scheduled for ${new Date(g.cartItem.scheduledDeliveryAt).toLocaleDateString()}`
                      : "Delivers when the order is placed."}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {approvalItems.length > 0 && (
          <Section title="Family approval queue">
            <div className="space-y-2">
              {approvalItems.map((g) => {
                const status = approvalStatuses[g.id] ?? g.cartItem.familyApproval?.status ?? "pending";
                return (
                  <div
                    key={g.id}
                    className="rounded-xl border border-separator bg-input/35 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {g.name}
                        </p>
                        <p className="mt-1 text-[11px] text-muted/60">
                          Requested by {g.cartItem.familyApproval?.requestedBy ?? profile?.displayName ?? "Child account"}
                        </p>
                      </div>
                      <ApprovalBadge status={status} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <ApprovalButton
                        active={status === "approved"}
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        label="Approve"
                        onClick={() =>
                          setApprovalStatuses((current) => ({ ...current, [g.id]: "approved" }))
                        }
                      />
                      <ApprovalButton
                        active={status === "pending"}
                        icon={<Clock3 className="h-3.5 w-3.5" />}
                        label="Pending"
                        onClick={() =>
                          setApprovalStatuses((current) => ({ ...current, [g.id]: "pending" }))
                        }
                      />
                      <ApprovalButton
                        active={status === "denied"}
                        icon={<XCircle className="h-3.5 w-3.5" />}
                        label="Deny"
                        onClick={() =>
                          setApprovalStatuses((current) => ({ ...current, [g.id]: "denied" }))
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <button
          onClick={placeOrder}
          disabled={loading}
          className="w-full rounded-xl bg-acid py-3 text-[13px] font-semibold text-background hover:brightness-110 disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </span>
          ) : (
            `Place order — ${formatPrice(total)}`
          )}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted/40">
          <ShieldCheck className="h-3 w-3" /> Mock checkout — no real card is charged.
        </p>
      </div>

      <aside className="rounded-2xl border border-separator bg-card p-5 h-fit space-y-5 lg:sticky lg:top-4">
        <div className="border-t border-separator pt-4">
          <p className="text-[12px] uppercase tracking-widest text-muted/60">Order summary</p>
          <ul className="mt-2 space-y-1 text-[13px] text-foreground/80">
            {list.map((g) => (
              <li key={g.id} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="truncate mr-3">{g.name}</span>
                  <span>{formatPrice(g.price.final)}</span>
                </div>
                {g.cartItem?.asGift && (
                  <p className="text-[11px] text-muted/55">
                    Gift for {g.cartItem.giftRecipient?.name || "recipient"}
                  </p>
                )}
                {g.cartItem?.familyApproval?.required && (
                  <p className="text-[11px] text-muted/55">
                    Family approval: {approvalStatuses[g.id] ?? g.cartItem.familyApproval.status}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-separator mt-3 pt-3 space-y-1 text-[12px] text-muted/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated tax (8%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex items-center justify-between text-[14px] font-semibold text-foreground pt-2 border-t border-separator">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {(giftItems.length > 0 || approvalItems.length > 0) && (
          <div className="rounded-xl border border-separator bg-input/35 p-3 text-[11px] text-muted/65">
            {giftItems.length > 0 && (
              <p className="flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5 text-acid" />
                {giftItems.length} gift {giftItems.length === 1 ? "line" : "lines"} will stay out of your library.
              </p>
            )}
            {approvalItems.length > 0 && (
              <p className="mt-1 flex items-center gap-1.5">
                <UsersRound className="h-3.5 w-3.5 text-acid" />
                Pending or denied family items remain receipt-only.
              </p>
            )}
          </div>
        )}
      </aside>
      </div>
    </motion.div>
  );
}

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const label =
    status === "approved" ? "Approved" : status === "denied" ? "Denied" : "Pending";
  const className =
    status === "approved"
      ? "border-green/30 bg-green/10 text-green"
      : status === "denied"
        ? "border-red/30 bg-red/10 text-red"
        : "border-separator bg-card text-muted/70";
  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

function ApprovalButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium ${
        active
          ? "border-acid/40 bg-acid/10 text-acid"
          : "border-separator bg-card text-muted/70 hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-widest text-muted/60 mb-2">{title}</p>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  colSpan = 1,
  children,
}: {
  label: string;
  error?: string;
  colSpan?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <div className={colSpan === 2 ? "col-span-2" : ""}>
      <label className="mb-1 block text-[11px] font-medium text-muted/70">{label}</label>
      {children}
      {error && <p className="mt-1 text-[10px] text-red">{error}</p>}
    </div>
  );
}

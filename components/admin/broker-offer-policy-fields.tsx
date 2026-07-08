"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BACKCOM_TYPES,
  BONUS_TYPES,
  PAYOUT_CYCLES,
  REBATE_TYPES,
} from "@/lib/brokers/offer-policy"

export type BrokerOfferFormFields = {
  backcomType: string
  backcomValue: string
  rebateType: string
  bonusType: string
  highlightOffer: string
  offerConditions: string
  payoutCycle: string
}

export const EMPTY_OFFER_FORM: BrokerOfferFormFields = {
  backcomType: "none",
  backcomValue: "",
  rebateType: "Không có",
  bonusType: "Không có",
  highlightOffer: "",
  offerConditions: "",
  payoutCycle: "Hằng tuần",
}

type Props = {
  value: BrokerOfferFormFields
  onChange: (next: BrokerOfferFormFields) => void
}

export function BrokerOfferPolicyFields({ value, onChange }: Props) {
  function set<K extends keyof BrokerOfferFormFields>(key: K, next: BrokerOfferFormFields[K]) {
    onChange({ ...value, [key]: next })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Promotion policy</h3>
        <p className="text-xs text-muted-foreground">
          Shown as badges and short conditions on the public broker panel.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="backcomType">Backcom</Label>
          <select
            id="backcomType"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={value.backcomType}
            onChange={(e) => set("backcomType", e.target.value)}
          >
            {BACKCOM_TYPES.map((option) => (
              <option key={option} value={option}>
                {option === "none" ? "None" : option === "custom" ? "Custom" : option}
              </option>
            ))}
          </select>
        </div>

        {value.backcomType === "custom" ? (
          <div className="space-y-2">
            <Label htmlFor="backcomValue">Custom Backcom</Label>
            <Input
              id="backcomValue"
              placeholder="e.g. 65%"
              value={value.backcomValue}
              onChange={(e) => set("backcomValue", e.target.value)}
            />
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}

        <div className="space-y-2">
          <Label htmlFor="rebateType">Hoàn phí</Label>
          <select
            id="rebateType"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={value.rebateType}
            onChange={(e) => set("rebateType", e.target.value)}
          >
            {REBATE_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bonusType">Bonus / Bounce Chịu Giá</Label>
          <select
            id="bonusType"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={value.bonusType}
            onChange={(e) => set("bonusType", e.target.value)}
          >
            {BONUS_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="payoutCycle">Payout cycle</Label>
          <select
            id="payoutCycle"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={value.payoutCycle}
            onChange={(e) => set("payoutCycle", e.target.value)}
          >
            {PAYOUT_CYCLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="highlightOffer">Ưu đãi nổi bật</Label>
          <textarea
            id="highlightOffer"
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Backcom tới 70%, hoàn phí hằng tuần, hỗ trợ tài khoản VIP"
            value={value.highlightOffer}
            onChange={(e) => set("highlightOffer", e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="offerConditions">Điều kiện nhận ưu đãi</Label>
          <textarea
            id="offerConditions"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Đăng ký qua link BTrading, xác minh tài khoản, giao dịch tối thiểu theo chính sách từng sàn"
            value={value.offerConditions}
            onChange={(e) => set("offerConditions", e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

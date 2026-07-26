// Kompaniya soha turi bo'yicha lead yorliqlari.
// Lead bazasi ustunlari (destination/travelers/travelDateText) bir xil qoladi —
// faqat ko'rsatiladigan yozuvlar sohaga qarab o'zgaradi.
// travel  = sayohat agentligi (Mir Sun Travel)
// clinic  = klinika (Shifomed)

export type LeadLabels = {
  destinationHeader: string; // ro'yxat ustuni
  dateHeader: string; // ro'yxat ustuni
  travelersHeader: string; // ro'yxat ustuni
  dateLabel: string; // batafsil sahifa
  travelersLabel: string; // batafsil sahifa
  contactTimeLabel: string; // batafsil sahifa
};

const CLINIC: LeadLabels = {
  destinationHeader: "Xizmat",
  dateHeader: "Qabul",
  travelersHeader: "Bemorlar",
  dateLabel: "Qabul sanasi va vaqti",
  travelersLabel: "Bemorlar soni",
  contactTimeLabel: "Qabul vaqti",
};

const TRAVEL: LeadLabels = {
  destinationHeader: "Manzil",
  dateHeader: "Sana",
  travelersHeader: "Kishi",
  dateLabel: "Sayohat sanasi",
  travelersLabel: "Necha kishi",
  contactTimeLabel: "Bog'lanish vaqti",
};

export function leadLabels(industry?: string | null): LeadLabels {
  return industry === "clinic" ? CLINIC : TRAVEL;
}

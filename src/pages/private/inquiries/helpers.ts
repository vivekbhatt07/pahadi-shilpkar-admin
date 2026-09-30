import type { InquiryStatus, InquiryType } from '@/types/api';

import { INQUIRY_STATUSES, INQUIRY_TYPES } from './constants';

export const isInquiryStatus = (value: string | null): value is InquiryStatus =>
  INQUIRY_STATUSES.includes(value as InquiryStatus);

export const isInquiryType = (value: string | null): value is InquiryType =>
  INQUIRY_TYPES.includes(value as InquiryType);

const firstName = (name: string) => name.trim().split(/\s+/)[0];

export const toMailtoUrl = (email: string) =>
  `mailto:${email}?subject=${encodeURIComponent('Re: your message to Pahadi Shilpkar')}`;

export const toTelUrl = (phone: string) =>
  `tel:${phone.replace(/[^\d+]/g, '')}`;

/**
 * wa.me needs the full international number. Shoppers here often type a
 * bare 10-digit Indian mobile number, sometimes with a leading 0 — those
 * get the +91 country code.
 */
export const toWhatsAppUrl = (phone: string, name: string) => {
  const digits = phone.replace(/\D/g, '');
  const local = digits.replace(/^0+/, '');
  const number =
    !phone.trim().startsWith('+') && local.length === 10
      ? `91${local}`
      : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hi ${firstName(name)}, `)}`;
};

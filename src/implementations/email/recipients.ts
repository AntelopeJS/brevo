import { Logging } from "@antelopejs/interface-core/logging";
import type { EmailAddress, EmailParams } from "@antelopejs/interface-email";

import {
  type BrevoAddress,
  getDefaultSender,
  getEmailWhitelist,
} from "./client";

export interface WhitelistResult {
  to: EmailAddress[];
  cc: EmailAddress[] | undefined;
  bcc: EmailAddress[] | undefined;
  isEmpty: boolean;
}

function formatAddress(address: EmailAddress): BrevoAddress {
  return typeof address === "string"
    ? { email: address }
    : { email: address.email, name: address.name };
}

export function formatAddresses(
  addresses: EmailAddress | EmailAddress[] | undefined,
): BrevoAddress[] | undefined {
  if (!addresses) {
    return undefined;
  }

  if (Array.isArray(addresses)) {
    return addresses.map((address) => formatAddress(address));
  }

  return [formatAddress(addresses)];
}

export function formatSingleAddress(
  addresses: EmailAddress | EmailAddress[] | undefined,
): BrevoAddress | undefined {
  const normalized = normalizeAddresses(addresses);
  const firstAddress = normalized[0];
  return firstAddress ? formatAddress(firstAddress) : undefined;
}

function normalizeAddresses(
  addresses: EmailAddress | EmailAddress[] | undefined,
): EmailAddress[] {
  if (!addresses) {
    return [];
  }

  return Array.isArray(addresses) ? addresses : [addresses];
}

function extractEmail(address: EmailAddress): string {
  return typeof address === "string" ? address : address.email;
}

export function getFirstRecipient(to: EmailAddress | EmailAddress[]): string {
  const recipients = normalizeAddresses(to);
  const firstRecipient = recipients[0];
  return firstRecipient ? extractEmail(firstRecipient) : "";
}

function filterWhitelistedAddresses(
  addresses: EmailAddress[],
  patterns: RegExp[],
): EmailAddress[] {
  return addresses.filter((address) => {
    const email = extractEmail(address);
    const isAllowed = patterns.some((pattern) => pattern.test(email));

    if (!isAllowed) {
      Logging.Warn(`[brevo/email] Recipient "${email}" filtered by whitelist`);
    }

    return isAllowed;
  });
}

function filterOptionalWhitelistedAddresses(
  addresses: EmailAddress | EmailAddress[] | undefined,
  patterns: RegExp[],
): EmailAddress[] | undefined {
  const normalized = normalizeAddresses(addresses);
  if (normalized.length === 0) {
    return undefined;
  }

  const filtered = filterWhitelistedAddresses(normalized, patterns);
  return filtered.length > 0 ? filtered : undefined;
}

export function applyWhitelist(
  params: Pick<EmailParams, "to" | "cc" | "bcc">,
): WhitelistResult {
  const whitelist = getEmailWhitelist();
  const normalizedTo = normalizeAddresses(params.to);

  if (!whitelist || whitelist.length === 0) {
    const cc = normalizeAddresses(params.cc);
    const bcc = normalizeAddresses(params.bcc);

    return {
      to: normalizedTo,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      isEmpty: normalizedTo.length === 0,
    };
  }

  const patterns = whitelist.map((entry) => new RegExp(entry));
  const to = filterWhitelistedAddresses(normalizedTo, patterns);
  const cc = filterOptionalWhitelistedAddresses(params.cc, patterns);
  const bcc = filterOptionalWhitelistedAddresses(params.bcc, patterns);

  return { to, cc, bcc, isEmpty: to.length === 0 };
}

export function applyFilteredRecipientsToEmailParams(
  params: EmailParams,
  filtered: WhitelistResult,
): EmailParams {
  const nextParams: EmailParams = { ...params, to: filtered.to };

  delete nextParams.cc;
  delete nextParams.bcc;

  if (filtered.cc) {
    nextParams.cc = filtered.cc;
  }

  if (filtered.bcc) {
    nextParams.bcc = filtered.bcc;
  }

  return nextParams;
}

export function resolveSender(
  from: EmailAddress | undefined,
): BrevoAddress | undefined {
  if (from) {
    return formatAddress(from);
  }

  return getDefaultSender();
}

import { relations } from "drizzle-orm/relations";
import { wallets, privacyTransfers, privacyEventLogs, walletPrivacyScores, privacyConfigs, walletLinkage } from "./schema";

export const privacyTransfersRelations = relations(privacyTransfers, ({one}) => ({
	wallet: one(wallets, {
		fields: [privacyTransfers.fromWalletId],
		references: [wallets.id]
	}),
}));

export const walletsRelations = relations(wallets, ({many}) => ({
	privacyTransfers: many(privacyTransfers),
	privacyEventLogs: many(privacyEventLogs),
	walletPrivacyScores: many(walletPrivacyScores),
	privacyConfigs: many(privacyConfigs),
	walletLinkages: many(walletLinkage),
}));

export const privacyEventLogsRelations = relations(privacyEventLogs, ({one}) => ({
	wallet: one(wallets, {
		fields: [privacyEventLogs.walletId],
		references: [wallets.id]
	}),
}));

export const walletPrivacyScoresRelations = relations(walletPrivacyScores, ({one}) => ({
	wallet: one(wallets, {
		fields: [walletPrivacyScores.walletId],
		references: [wallets.id]
	}),
}));

export const privacyConfigsRelations = relations(privacyConfigs, ({one}) => ({
	wallet: one(wallets, {
		fields: [privacyConfigs.walletId],
		references: [wallets.id]
	}),
}));

export const walletLinkageRelations = relations(walletLinkage, ({one}) => ({
	wallet: one(wallets, {
		fields: [walletLinkage.walletId],
		references: [wallets.id]
	}),
}));
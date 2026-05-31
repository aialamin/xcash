package handlers

import (
	"math"
	"xcash/backend/database"
	"xcash/backend/models"
)

// CalculateFee returns the fee for a given transaction type and amount
func CalculateFee(txType string, amount float64) float64 {
	var cfg models.FeeConfig
	if database.DB.Where("tx_type = ?", txType).First(&cfg).Error != nil {
		// Fallback defaults
		return defaultFee(txType, amount)
	}
	if amount <= cfg.FreeUpTo {
		return 0
	}
	fee := cfg.FeeFlat + (amount * cfg.FeePercent / 100)
	if cfg.FeeMin > 0 && fee < cfg.FeeMin {
		fee = cfg.FeeMin
	}
	if cfg.FeeMax > 0 && fee > cfg.FeeMax {
		fee = cfg.FeeMax
	}
	return math.Ceil(fee)
}

func defaultFee(txType string, amount float64) float64 {
	switch txType {
	case "send_money":
		if amount <= 100 { return 0 }
		return 5
	case "cash_out":
		return math.Ceil(amount * 0.018)
	case "payment":
		return 0 // free merchant payment
	case "bill_pay":
		return math.Ceil(amount * 0.005) // 0.5%
	case "recharge":
		return 0 // free recharge
	case "add_money":
		return 0 // free add money
	}
	return 0
}

// SeedDefaultFees inserts default fee config on first run
func SeedDefaultFees() {
	fees := []models.FeeConfig{
		{TxType: "send_money",  FeeFlat: 5,    FeePercent: 0,    FeeMin: 0,  FeeMax: 0,  FreeUpTo: 100},
		{TxType: "cash_out",   FeeFlat: 0,    FeePercent: 1.8,  FeeMin: 5,  FeeMax: 500, FreeUpTo: 0},
		{TxType: "payment",    FeeFlat: 0,    FeePercent: 0,    FeeMin: 0,  FeeMax: 0,  FreeUpTo: 0},
		{TxType: "bill_pay",   FeeFlat: 0,    FeePercent: 0.5,  FeeMin: 2,  FeeMax: 50,  FreeUpTo: 0},
		{TxType: "recharge",   FeeFlat: 0,    FeePercent: 0,    FeeMin: 0,  FeeMax: 0,  FreeUpTo: 0},
		{TxType: "add_money",  FeeFlat: 0,    FeePercent: 0,    FeeMin: 0,  FeeMax: 0,  FreeUpTo: 0},
		{TxType: "loan_emi",   FeeFlat: 10,   FeePercent: 0,    FeeMin: 0,  FeeMax: 0,  FreeUpTo: 0},
	}
	for _, f := range fees {
		database.DB.Where("tx_type = ?", f.TxType).FirstOrCreate(&f)
	}
}

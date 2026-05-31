package middleware

// FraudScore holds the result of a fraud risk evaluation
type FraudScore struct {
	Score  int      // 0-100
	Flags  []string // human-readable reasons
	Block  bool     // true = reject transaction
}

// ScoreTransaction evaluates rule-based fraud signals
func ScoreTransaction(
	userID string,
	amount float64,
	balance float64,
	isNewReceiver bool,
	hourOfDay int,
	recentTxCount int, // transactions in last hour
) FraudScore {
	score := 0
	var flags []string

	// Velocity check — more than 5 transactions in 1 hour
	if recentTxCount >= 5 {
		score += 40
		flags = append(flags, "high_velocity")
	} else if recentTxCount >= 3 {
		score += 20
		flags = append(flags, "elevated_velocity")
	}

	// Large fraction of balance
	if balance > 0 {
		ratio := amount / balance
		if ratio > 0.90 {
			score += 30
			flags = append(flags, "drains_balance")
		} else if ratio > 0.70 {
			score += 15
			flags = append(flags, "large_balance_fraction")
		}
	}

	// Night transaction (1am–5am)
	if hourOfDay >= 1 && hourOfDay <= 5 {
		score += 15
		flags = append(flags, "unusual_hour")
	}

	// New receiver + large amount
	if isNewReceiver && amount >= 5000 {
		score += 20
		flags = append(flags, "new_receiver_large_amount")
	}

	// Large absolute amount
	if amount >= 20000 {
		score += 15
		flags = append(flags, "large_amount")
	}

	// Block if score >= 70
	block := score >= 70

	return FraudScore{Score: score, Flags: flags, Block: block}
}

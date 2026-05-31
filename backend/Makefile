.PHONY: run build tidy docker-up docker-down seed

run:
	go run ./cmd/main.go

build:
	go build -o bin/xcash ./cmd/main.go

tidy:
	go mod tidy

docker-up:
	cd .. && docker-compose up -d

docker-down:
	cd .. && docker-compose down

seed:
	go run ./cmd/seed/main.go

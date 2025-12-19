.PHONY: dev lint test

dev:
	docker-compose up --build

lint:
	./scripts/verify.sh

test:
	./scripts/verify.sh

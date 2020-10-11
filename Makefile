.PHONY: console
console: ## Run container and switch to terminal
	docker-compose run --rm --service-ports node bash

.PHONY: help
help: ## Help information
	@cat $(MAKEFILE_LIST) | grep -e "^[a-zA-Z_\-]*: *.*## *" | awk '\
	    BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

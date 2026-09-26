.DEFAULT_GOAL := help
STOW_PACKAGES := shared opencode pi-mono
STOW          := $(shell command -v stow 2>/dev/null)

# Shared resources → opencode symlink mappings
# Format: source (under ~/.ai-agents/) → destination (under ~/.config/opencode/)
SHARED_SRC_BASE := $(HOME)/.ai-agents
SHARED_DST_BASE := $(HOME)/.config/opencode
SHARED_LINKS    := skills commands rules scripts

.PHONY: help
help: ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Installation

.PHONY: check
check: ## Verify setup
	@for pkg in $(STOW_PACKAGES); do \
		test -d "$$pkg" || (echo "Error: $$pkg directory not found" && exit 1); \
	done
ifdef STOW
	@echo "✓ Using stow: $(STOW)"
	@test -f .stowrc || echo "Warning: .stowrc not found"
else
	@echo "⚠ stow not found - will use ln -s instead"
endif
	@echo "✓ Setup verified"

.PHONY: submodules
submodules: ## Initialize and update git submodules
	@echo "Initializing submodules..."
	@git submodule update --init --recursive
	@echo "✓ Submodules ready"

.PHONY: install
install: check submodules stow-install link-shared ## Install all packages and extra symlinks
	@echo "✓ Installation complete"

.PHONY: stow-install
stow-install: ## Stow all packages to $HOME
ifdef STOW
	@echo "Stowing packages with stow..."
	@stow --adopt $(STOW_PACKAGES) || (echo "✗ Stow failed - check for conflicts" && exit 1)
else
	@echo "Installing with ln -s (stow not found)..."
	@$(MAKE) -s install-ln
endif

.PHONY: install-ln
install-ln: ## Install using ln -s (fallback when stow is unavailable)
	@for pkg in $(STOW_PACKAGES); do \
		echo "  Linking $$pkg..."; \
		find "$$pkg" -type f | while read src; do \
			rel=$${src#$$pkg/}; \
			dst="$(HOME)/$$rel"; \
			mkdir -p "$$(dirname $$dst)"; \
			if [ -e "$$dst" ] && [ ! -L "$$dst" ]; then \
				echo "    ✗ $$dst exists and is not a symlink - skipping"; \
			else \
				ln -sfn "$(CURDIR)/$$src" "$$dst"; \
				echo "    ✓ $$dst"; \
			fi; \
		done; \
	done

.PHONY: link-shared
link-shared: link-agents ## Create ~/.config/opencode/{skills,commands,rules} and flat agents symlinks
	@mkdir -p "$(SHARED_DST_BASE)"
	@for name in $(SHARED_LINKS); do \
		src="$(SHARED_SRC_BASE)/$$name"; \
		dst="$(SHARED_DST_BASE)/$$name"; \
		if [ ! -d "$$src" ]; then \
			echo "⚠ $$src not found - skipping (run stow-install first)"; \
		elif [ -L "$$dst" ]; then \
			ln -sfn "$$src" "$$dst"; \
			echo "✓ $$name symlink updated: $$dst -> $$src"; \
		elif [ -e "$$dst" ]; then \
			echo "⚠ $$dst exists and is not a symlink - skipping (remove it manually)"; \
		else \
			ln -sfn "$$src" "$$dst"; \
			echo "✓ $$name symlink created: $$dst -> $$src"; \
		fi; \
	done

.PHONY: link-agents
link-agents: ## Create flat symlinks in ~/.config/opencode/agents/ for all ~/.ai-agents/agents/*/*.md
	@src_dir="$(SHARED_SRC_BASE)/agents"; \
	dst_dir="$(SHARED_DST_BASE)/agents"; \
	if [ ! -d "$$src_dir" ]; then \
		echo "⚠ $$src_dir not found - skipping (run stow-install first)"; \
		exit 0; \
	fi; \
	if [ -L "$$dst_dir" ]; then \
		rm -f "$$dst_dir"; \
	fi; \
	mkdir -p "$$dst_dir"; \
	find "$$dst_dir" -type l -delete; \
	count=0; \
	for f in $$(find -L "$$src_dir" -type f -name '*.md'); do \
		ln -sfn "$$f" "$$dst_dir/$$(basename "$$f")"; \
		count=$$((count + 1)); \
	done; \
	echo "✓ agents: $$count flattened agent symlinks in $$dst_dir"

.PHONY: uninstall
uninstall: unlink-shared stow-uninstall ## Uninstall all packages and remove extra symlinks
	@echo "✓ Uninstallation complete"

.PHONY: stow-uninstall
stow-uninstall: ## Unstow all packages
ifdef STOW
	@echo "Unstowing packages..."
	@stow -D $(STOW_PACKAGES) 2>/dev/null || true
else
	@echo "Removing symlinks (stow not found)..."
	@$(MAKE) -s uninstall-ln
endif

.PHONY: uninstall-ln
uninstall-ln: ## Remove ln -s links (fallback)
	@for pkg in $(STOW_PACKAGES); do \
		find "$$pkg" -type f | while read src; do \
			rel=$${src#$$pkg/}; \
			dst="$(HOME)/$$rel"; \
			if [ -L "$$dst" ]; then \
				rm -f "$$dst"; \
				echo "  ✓ removed $$dst"; \
			fi; \
		done; \
	done

.PHONY: unlink-shared
unlink-shared: unlink-agents ## Remove ~/.config/opencode/{skills,commands,rules} symlinks
	@for name in $(SHARED_LINKS); do \
		dst="$(SHARED_DST_BASE)/$$name"; \
		if [ -L "$$dst" ]; then \
			rm -f "$$dst"; \
			echo "✓ Removed $$name symlink: $$dst"; \
		fi; \
	done

.PHONY: unlink-agents
unlink-agents: ## Remove ~/.config/opencode/agents/ directory and symlinks
	@dst_dir="$(SHARED_DST_BASE)/agents"; \
	if [ -L "$$dst_dir" ]; then \
		rm -f "$$dst_dir"; \
		echo "✓ Removed legacy agents symlink: $$dst_dir"; \
	elif [ -d "$$dst_dir" ]; then \
		rm -rf "$$dst_dir"; \
		echo "✓ Removed agents directory and symlinks: $$dst_dir"; \
	fi

.PHONY: restow
restow: ## Restow all packages
ifdef STOW
	@echo "Restowing packages..."
	@stow -R $(STOW_PACKAGES) || (echo "✗ Restow failed - check for conflicts" && exit 1)
else
	@$(MAKE) -s uninstall-ln install-ln
endif
	@$(MAKE) -s link-shared
	@echo "✓ Restow complete"

##@ Utilities

.PHONY: status
status: ## Show installation status for all packages
	@echo "Stow packages: $(STOW_PACKAGES)"
	@echo "Installation method: $(if $(STOW),stow,ln -s)"
	@echo ""
	@echo "Stowed paths:"
	@for pkg in $(STOW_PACKAGES); do \
		echo "  $$pkg -> $(HOME)"; \
	done
	@echo ""
	@echo "Shared symlinks ($(SHARED_DST_BASE)/ -> $(SHARED_SRC_BASE)/):"
	@agents_dst="$(SHARED_DST_BASE)/agents"; \
	if [ -d "$$agents_dst" ] && [ ! -L "$$agents_dst" ]; then \
		count=$$(find "$$agents_dst" -type l -name '*.md' | wc -l | tr -d ' '); \
		echo "  ✓ agents -> ($$count flattened symlinks in $$agents_dst)"; \
	elif [ -L "$$agents_dst" ]; then \
		echo "  ⚠ agents -> $$(readlink $$agents_dst) (unflattened folder symlink)"; \
	else \
		echo "  ✗ agents not linked"; \
	fi
	@for name in $(SHARED_LINKS); do \
		dst="$(SHARED_DST_BASE)/$$name"; \
		if [ -L "$$dst" ]; then \
			echo "  ✓ $$name -> $$(readlink $$dst)"; \
		elif [ -e "$$dst" ]; then \
			echo "  ⚠ $$name exists but is not a symlink"; \
		else \
			echo "  ✗ $$name not linked"; \
		fi; \
	done

.PHONY: clean
clean: ## Remove broken symlinks under $HOME/.ai-agents and $HOME/.config/opencode
	@echo "Cleaning broken symlinks..."
	@find "$(HOME)/.ai-agents" "$(HOME)/.config/opencode" -xtype l -delete 2>/dev/null || true
	@echo "✓ Cleanup complete"

##@ Pre-commit hooks

.PHONY: install-hooks
install-hooks: ## Install pre-commit hooks
	@command -v pre-commit >/dev/null 2>&1 || \
		(echo "❌ pre-commit not installed. Install with: pip install pre-commit" && exit 1)
	@pre-commit install
	@echo "✓ Pre-commit hooks installed"

.PHONY: uninstall-hooks
uninstall-hooks: ## Uninstall pre-commit hooks
	@pre-commit uninstall
	@echo "✓ Pre-commit hooks uninstalled"

.PHONY: run-hooks
run-hooks: ## Run pre-commit hooks manually
	@pre-commit run --all-files

.PHONY: update-hooks
update-hooks: ## Update pre-commit hooks to latest versions
	@pre-commit autoupdate
	@echo "✓ Pre-commit hooks updated"

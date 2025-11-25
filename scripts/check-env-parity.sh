#!/bin/bash
#
# Environment Parity Validator
# Validates that all required environment variables are present and properly configured.
#
# Usage:
#   ./scripts/check-env-parity.sh          # Check current environment
#   ./scripts/check-env-parity.sh --ci     # CI mode (strict, no prompts)
#   ./scripts/check-env-parity.sh --help   # Show help
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
CI_MODE=false
VERBOSE=false
EXIT_CODE=0

# Required environment variables (must be set and non-empty)
REQUIRED_VARS=(
  "ENCRYPTION_KEY"
)

# Required for production (can be mocked in CI/test)
REQUIRED_PROD_VARS=(
  "CLERK_SECRET_KEY"
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  "NEXT_PUBLIC_CONVEX_URL"
)

# Optional environment variables (with defaults)
OPTIONAL_VARS=(
  "NODE_ENV"
  "PORT"
  "LOG_LEVEL"
  "GROQ_API_KEY"
  "CONVEX_URL"
  "OLLAMA_BASE_URL"
  "OLLAMA_MODEL_ID"
  "RATE_LIMIT_DISABLED"
  "RATE_LIMIT_BLOCK_MS"
  "RATE_LIMIT_WINDOW_MS"
  "RATE_LIMIT_MAX_REQS"
  "CHAT_WINDOW_MS"
  "CHAT_MAX_REQS"
  "CHAT_MAX_CONCURRENCY"
  "CACHE_ENABLED"
  "AI_TELEMETRY_ENABLED"
  "ENABLE_METRICS_ENDPOINT"
)

# Print usage information
usage() {
  echo "Environment Parity Validator"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --ci       Run in CI mode (strict validation, no interactive prompts)"
  echo "  --verbose  Show all environment variable statuses"
  echo "  --help     Show this help message"
  echo ""
  echo "Required Variables:"
  for var in "${REQUIRED_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Production Required Variables (can be mocked in CI):"
  for var in "${REQUIRED_PROD_VARS[@]}"; do
    echo "  - $var"
  done
}

# Log functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

# Check if a variable is set and non-empty
check_var() {
  local var_name="$1"
  local is_required="$2"
  local value="${!var_name}"

  if [ -z "$value" ]; then
    if [ "$is_required" = "required" ]; then
      log_error "Missing required variable: $var_name"
      EXIT_CODE=1
    elif [ "$VERBOSE" = "true" ]; then
      log_warning "Optional variable not set: $var_name"
    fi
    return 1
  else
    if [ "$VERBOSE" = "true" ]; then
      # Mask sensitive values
      if [[ "$var_name" =~ (KEY|SECRET|PASSWORD|TOKEN) ]]; then
        log_success "$var_name is set (value masked)"
      else
        local display_value="$value"
        if [ ${#value} -gt 50 ]; then
          display_value="${value:0:47}..."
        fi
        log_success "$var_name = $display_value"
      fi
    fi
    return 0
  fi
}

# Validate ENCRYPTION_KEY format
validate_encryption_key() {
  local key="$ENCRYPTION_KEY"
  if [ -z "$key" ]; then
    return 1
  fi
  
  local length=${#key}
  if [ $length -lt 32 ]; then
    log_error "ENCRYPTION_KEY must be at least 32 characters (current: $length)"
    EXIT_CODE=1
    return 1
  fi
  
  if [ "$VERBOSE" = "true" ]; then
    log_success "ENCRYPTION_KEY has valid length ($length chars)"
  fi
  return 0
}

# Validate URL format
validate_url() {
  local var_name="$1"
  local value="${!var_name}"
  
  if [ -z "$value" ]; then
    return 0  # Empty is OK for optional URLs
  fi
  
  # Simple URL validation
  if [[ ! "$value" =~ ^https?:// ]]; then
    log_error "$var_name must be a valid URL starting with http:// or https://"
    EXIT_CODE=1
    return 1
  fi
  return 0
}

# Parse command line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --ci)
        CI_MODE=true
        shift
        ;;
      --verbose)
        VERBOSE=true
        shift
        ;;
      --help)
        usage
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        usage
        exit 1
        ;;
    esac
  done
}

# Main validation logic
main() {
  parse_args "$@"

  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║           Environment Parity Validator                       ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""

  if [ "$CI_MODE" = "true" ]; then
    log_info "Running in CI mode"
  fi

  # Check required variables
  log_info "Checking required environment variables..."
  echo ""
  
  for var in "${REQUIRED_VARS[@]}"; do
    check_var "$var" "required"
  done

  # Check production required variables
  log_info "Checking production environment variables..."
  echo ""
  
  for var in "${REQUIRED_PROD_VARS[@]}"; do
    if [ "$CI_MODE" = "true" ]; then
      # In CI, just warn if missing but don't fail (can use mock values)
      if ! check_var "$var" "optional"; then
        log_warning "$var not set (using mock value in CI is OK)"
      fi
    else
      check_var "$var" "required"
    fi
  done

  # Check optional variables if verbose
  if [ "$VERBOSE" = "true" ]; then
    echo ""
    log_info "Checking optional environment variables..."
    echo ""
    
    for var in "${OPTIONAL_VARS[@]}"; do
      check_var "$var" "optional"
    done
  fi

  # Validate specific formats
  echo ""
  log_info "Validating environment variable formats..."
  echo ""
  
  validate_encryption_key
  validate_url "NEXT_PUBLIC_CONVEX_URL"
  validate_url "CONVEX_URL"
  validate_url "OLLAMA_BASE_URL"

  # Summary
  echo ""
  echo "══════════════════════════════════════════════════════════════"
  if [ $EXIT_CODE -eq 0 ]; then
    log_success "All environment checks passed!"
    echo ""
    echo "Your environment is properly configured."
  else
    log_error "Environment validation failed!"
    echo ""
    echo "Please set the missing required environment variables."
    echo "See docs/DEPLOYMENT.md for more information."
  fi
  echo "══════════════════════════════════════════════════════════════"
  echo ""

  exit $EXIT_CODE
}

# Run main function
main "$@"

# Terraform Documentation Style

Complete reference for documenting Terraform code, following HashiCorp best practices and terraform-docs standards.

## Basic Principles

- Every variable and output must have a `description`
- Descriptions should be clear, concise, and actionable
- Use comments for complex resource logic
- Module README should explain purpose and usage
- Follow consistent formatting and naming

## Variable Documentation

### Basic Variable

```hcl
variable "instance_type" {
  description = "EC2 instance type for the application servers."
  type        = string
  default     = "t3.medium"
}
```

### Variable with Validation

```hcl
variable "environment" {
  description = "Deployment environment (dev, staging, prod). Determines resource naming and sizing."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

### Complex Variable Types

```hcl
variable "vpc_config" {
  description = "VPC configuration including CIDR blocks and subnet configuration."
  type = object({
    cidr_block           = string
    enable_dns_hostnames = bool
    enable_dns_support   = bool
    public_subnets       = list(string)
    private_subnets      = list(string)
  })

  default = {
    cidr_block           = "10.0.0.0/16"
    enable_dns_hostnames = true
    enable_dns_support   = true
    public_subnets       = ["10.0.1.0/24", "10.0.2.0/24"]
    private_subnets      = ["10.0.10.0/24", "10.0.11.0/24"]
  }
}
```

### Sensitive Variable

```hcl
variable "database_password" {
  description = "Master password for the RDS database. Must be at least 16 characters."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.database_password) >= 16
    error_message = "Database password must be at least 16 characters."
  }
}
```

### Variable with Example

```hcl
variable "tags" {
  description = <<-EOT
    Common tags to apply to all resources.

    Example:
      tags = {
        Environment = "production"
        Project     = "myapp"
        ManagedBy   = "terraform"
      }
  EOT
  type        = map(string)
  default     = {}
}
```

### List Variable

```hcl
variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the application. Use 0.0.0.0/0 for public access (not recommended for production)."
  type        = list(string)
  default     = []
}
```

### Map Variable

```hcl
variable "instance_types_by_env" {
  description = "Map of environment names to EC2 instance types. Allows different instance sizes per environment."
  type        = map(string)

  default = {
    dev     = "t3.small"
    staging = "t3.medium"
    prod    = "t3.large"
  }
}
```

## Output Documentation

### Basic Output

```hcl
output "vpc_id" {
  description = "ID of the created VPC."
  value       = aws_vpc.main.id
}
```

### Output with Sensitive Data

```hcl
output "database_endpoint" {
  description = "Connection endpoint for the RDS database."
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}
```

### Complex Output

```hcl
output "load_balancer_details" {
  description = "Load balancer configuration including DNS name, ARN, and zone ID."
  value = {
    dns_name = aws_lb.main.dns_name
    arn      = aws_lb.main.arn
    zone_id  = aws_lb.main.zone_id
  }
}
```

### Output with Usage Instructions

```hcl
output "ssh_command" {
  description = <<-EOT
    SSH command to connect to the bastion host.

    Usage:
      $(terraform output -raw ssh_command)
  EOT
  value = "ssh -i ${var.key_name}.pem ec2-user@${aws_instance.bastion.public_ip}"
}
```

## Resource Comments

### Simple Resource

```hcl
# VPC for the application infrastructure
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}
```

### Complex Resource with Inline Comments

```hcl
resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  # Use the first available private subnet
  subnet_id = var.private_subnet_ids[0]

  # Security group for application traffic
  vpc_security_group_ids = [aws_security_group.app.id]

  # IAM role for CloudWatch logs and S3 access
  iam_instance_profile = aws_iam_instance_profile.app.name

  # User data script runs on first boot
  user_data = templatefile("${path.module}/scripts/init.sh", {
    environment = var.environment
    region      = var.aws_region
  })

  # Ensure the instance is replaced before destroying
  # to maintain availability during updates
  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-app-${var.environment}"
    Role = "application-server"
  })
}
```

### Conditional Resource

```hcl
# Create NAT gateway only for production environments
# to reduce costs in dev/staging
resource "aws_nat_gateway" "main" {
  count = var.environment == "prod" ? length(var.public_subnet_ids) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = var.public_subnet_ids[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}
```

### Dynamic Block

```hcl
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  # Create ingress rules from variable list
  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      description = ingress.value.description
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.common_tags
}
```

## Data Source Comments

```hcl
# Get the latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Retrieve current AWS region
data "aws_region" "current" {}

# Get availability zones in current region
data "aws_availability_zones" "available" {
  state = "available"
}
```

## Module Documentation

### Module Block with Comments

```hcl
# VPC module creates networking infrastructure
# including subnets, route tables, and internet gateway
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  # Create subnets across multiple availability zones
  # for high availability
  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  # Enable NAT gateway for private subnet internet access
  enable_nat_gateway = var.environment == "prod"
  single_nat_gateway = var.environment != "prod"

  # Enable DNS for service discovery
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = var.common_tags
}
```

## Local Values

```hcl
locals {
  # Common name prefix for all resources
  name_prefix = "${var.project_name}-${var.environment}"

  # Map of AZ names to subnet indices
  # Used for distributing resources across AZs
  az_to_subnet_index = {
    for idx, az in data.aws_availability_zones.available.names :
    az => idx
  }

  # Merged tags combining common tags with resource-specific ones
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "terraform"
      Project     = var.project_name
    }
  )
}
```

## File Headers

### variables.tf

```hcl
# Variables for the VPC module
#
# This file defines all configurable parameters for the VPC,
# including CIDR blocks, subnet configuration, and feature flags.

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

# ... more variables
```

### outputs.tf

```hcl
# Outputs from the VPC module
#
# These outputs expose VPC resources for use by other modules
# or for displaying important information to users.

output "vpc_id" {
  description = "ID of the created VPC."
  value       = aws_vpc.main.id
}

# ... more outputs
```

### main.tf

```hcl
# Main VPC infrastructure
#
# This file creates the core VPC resources including:
# - VPC with DNS support
# - Internet Gateway
# - Public and private subnets
# - Route tables and associations
# - NAT Gateway (production only)

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ... resources
```

## Module README.md Template

```markdown
# VPC Module

Terraform module for creating a VPC with public and private subnets.

## Features

- Multi-AZ subnet creation
- Optional NAT Gateway
- DNS support enabled
- Customizable CIDR blocks
- Flexible tagging

## Usage

```hcl
module "vpc" {
  source = "./modules/vpc"

  project_name = "myapp"
  environment  = "production"
  vpc_cidr     = "10.0.0.0/16"

  private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnet_cidrs  = ["10.0.10.0/24", "10.0.11.0/24"]

  tags = {
    Owner = "platform-team"
  }
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.5.0 |
| aws | ~> 5.0 |

## Providers

| Name | Version |
|------|---------|
| aws | ~> 5.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| project_name | Name of the project | `string` | n/a | yes |
| environment | Deployment environment | `string` | n/a | yes |
| vpc_cidr | VPC CIDR block | `string` | `"10.0.0.0/16"` | no |

## Outputs

| Name | Description |
|------|-------------|
| vpc_id | ID of the created VPC |
| private_subnet_ids | List of private subnet IDs |
| public_subnet_ids | List of public subnet IDs |

## Examples

See the `examples/` directory for complete usage examples.

```

## Best Practices

### Variable Descriptions

**DO** ✅

```hcl
variable "instance_count" {
  description = "Number of EC2 instances to create. Set to 0 to disable."
  type        = number
  default     = 1
}
```

**DON'T** ❌

```hcl
variable "instance_count" {
  description = "Instance count"
  type        = number
  default     = 1
}
```

### Output Descriptions

**DO** ✅

```hcl
output "load_balancer_dns" {
  description = "DNS name of the load balancer. Use this for CNAME records."
  value       = aws_lb.main.dns_name
}
```

**DON'T** ❌

```hcl
output "load_balancer_dns" {
  description = "The DNS"
  value       = aws_lb.main.dns_name
}
```

### Comments for Complex Logic

**DO** ✅

```hcl
# Calculate number of NAT gateways based on environment
# Production: One per AZ for high availability
# Non-production: Single NAT to reduce costs
locals {
  nat_gateway_count = var.environment == "prod" ? length(var.availability_zones) : 1
}
```

**DON'T** ❌

```hcl
# NAT gateway count
locals {
  nat_gateway_count = var.environment == "prod" ? length(var.availability_zones) : 1
}
```

## Multi-line Descriptions

### Using Heredoc

```hcl
variable "monitoring_config" {
  description = <<-EOT
    Monitoring and alerting configuration.

    Configure CloudWatch alarms and SNS notifications for the application.
    All thresholds are in the units specified by CloudWatch for each metric.

    Example:
      monitoring_config = {
        enable_alarms           = true
        cpu_threshold           = 80
        memory_threshold        = 85
        disk_threshold          = 90
        notification_email      = "ops@example.com"
      }
  EOT

  type = object({
    enable_alarms      = bool
    cpu_threshold      = number
    memory_threshold   = number
    disk_threshold     = number
    notification_email = string
  })
}
```

## terraform-docs Integration

### Module Structure for Auto-documentation

```
module/
├── README.md           # Generated by terraform-docs
├── main.tf            # Main resources
├── variables.tf       # Input variables
├── outputs.tf         # Output values
├── versions.tf        # Provider requirements
├── locals.tf          # Local values
└── examples/
    └── complete/
        ├── main.tf
        └── README.md
```

### .terraform-docs.yml

```yaml
formatter: "markdown table"

version: ""

header-from: main.tf
footer-from: ""

recursive:
  enabled: false
  path: modules

sections:
  hide: []
  show: []

content: |-
  {{ .Header }}

  ## Usage

  ```hcl
  {{ include "examples/complete/main.tf" }}
  ```

  {{ .Requirements }}

  {{ .Providers }}

  {{ .Inputs }}

  {{ .Outputs }}

output:
  file: "README.md"
  mode: inject
  template: |-
    <!-- BEGIN_TF_DOCS -->
    {{ .Content }}
    <!-- END_TF_DOCS -->

sort:
  enabled: true
  by: name

settings:
  anchor: true
  color: true
  default: true
  description: true
  escape: true
  hide-empty: false
  html: true
  indent: 2
  lockfile: true
  read-comments: true
  required: true
  sensitive: true
  type: true

```

## Version Constraints

```hcl
# Always specify version constraints for providers
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}
```

## Complete Example

```hcl
# Kubernetes cluster module
#
# Creates a GKE cluster with node pools, networking, and IAM configuration.
# Supports both zonal and regional clusters with configurable scaling.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# ========================================
# Variables
# ========================================

variable "project_id" {
  description = "GCP project ID where the cluster will be created."
  type        = string
}

variable "cluster_name" {
  description = "Name of the GKE cluster. Must be unique within the project."
  type        = string
}

variable "region" {
  description = "GCP region for the cluster. Use region for regional cluster, zone for zonal."
  type        = string
}

variable "node_count" {
  description = "Initial number of nodes per zone. Autoscaling can adjust this based on load."
  type        = number
  default     = 3

  validation {
    condition     = var.node_count >= 1 && var.node_count <= 100
    error_message = "Node count must be between 1 and 100."
  }
}

variable "node_machine_type" {
  description = "Machine type for cluster nodes (e.g., n1-standard-2, e2-medium)."
  type        = string
  default     = "e2-medium"
}

# ========================================
# Resources
# ========================================

# Primary GKE cluster
resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region

  # Use the most recent GKE version
  min_master_version = data.google_container_engine_versions.default.latest_master_version

  # Remove default node pool and manage separately
  remove_default_node_pool = true
  initial_node_count       = 1

  # Enable Workload Identity for secure pod-to-service authentication
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Network configuration
  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  # Enable IP aliasing for pod networking
  ip_allocation_policy {
    cluster_ipv4_cidr_block  = "/16"
    services_ipv4_cidr_block = "/22"
  }
}

# Managed node pool with autoscaling
resource "google_container_node_pool" "primary_nodes" {
  name     = "${var.cluster_name}-node-pool"
  location = var.region
  cluster  = google_container_cluster.primary.name

  # Enable autoscaling between min and max nodes
  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }

  # Node configuration
  node_config {
    machine_type = var.node_machine_type

    # Use OAuth scopes for GCP API access
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    # Enable GKE metadata server for Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      environment = var.environment
    }

    tags = ["gke-node", "${var.cluster_name}"]
  }
}

# ========================================
# Outputs
# ========================================

output "cluster_endpoint" {
  description = "GKE cluster endpoint. Use with kubectl to connect to the cluster."
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "Base64 encoded CA certificate for cluster authentication."
  value       = google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "cluster_name" {
  description = "Name of the created GKE cluster."
  value       = google_container_cluster.primary.name
}
```

## Summary

Good Terraform documentation should:

- ✅ Describe **what** and **why**, not **how**
- ✅ Include examples for complex variables
- ✅ Document validation rules
- ✅ Explain conditional logic
- ✅ Use clear, actionable language
- ✅ Be maintained as code changes
- ✅ Support terraform-docs generation

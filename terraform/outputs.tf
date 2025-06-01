output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app_with_rds.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.network.private_subnet_ids
}

# RDS outputs
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.rds_endpoint
}

output "database_url" {
  description = "Database URL"
  value       = "postgresql://${var.database_username}:${var.database_password}@${module.rds.rds_endpoint}:${module.rds.rds_port}/${var.database_name}"
  sensitive   = true
}

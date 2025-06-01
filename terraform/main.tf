# ECRリポジトリ
resource "aws_ecr_repository" "backend" {
  name                 = "${var.project}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ネットワーク
module "network" {
  source = "./modules/network"

  project              = var.project
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# ALB
module "alb" {
  source = "./modules/alb"

  project           = var.project
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
  container_port    = var.container_port
  certificate_arn   = var.certificate_arn
}

# ECS（初期作成、セキュリティグループのみ）
module "ecs" {
  source = "./modules/ecs"

  project               = var.project
  aws_region           = var.aws_region
  vpc_id               = module.network.vpc_id
  public_subnet_ids    = module.network.public_subnet_ids
  alb_security_group_id = module.alb.alb_security_group_id
  target_group_arn     = module.alb.target_group_arn
  container_port       = var.container_port
  container_cpu        = var.container_cpu
  container_memory     = var.container_memory
  desired_count        = var.desired_count
  ecr_repository_url   = aws_ecr_repository.backend.repository_url
  clerk_secret_key     = var.clerk_secret_key
  clerk_webhook_secret = var.clerk_webhook_secret
}

# RDS
module "rds" {
  source = "./modules/rds"

  project               = var.project
  vpc_id               = module.network.vpc_id
  private_subnet_ids   = module.network.private_subnet_ids
  ecs_security_group_id = module.ecs.ecs_security_group_id

  # RDS設定
  engine_version    = var.rds_engine_version
  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage
  database_name     = var.database_name
  database_username = var.database_username
  database_password = var.database_password

  # 環境に応じた設定
  deletion_protection = false
  skip_final_snapshot = true
}

# SSM Parameter Store
module "ssm" {
  source = "./modules/ssm"

  project     = var.project
  environment = var.environment

  # Environment variables
  clerk_secret_key       = var.clerk_secret_key
  clerk_webhook_secret   = var.clerk_webhook_secret
  database_url          = "postgresql://${var.database_username}:${var.database_password}@${module.rds.rds_endpoint}/${var.database_name}?sslmode=require"
  gemini_api_key        = var.gemini_api_key
  stripe_secret_key     = var.stripe_secret_key
  stripe_publishable_key = var.stripe_publishable_key
  stripe_webhook_secret = var.stripe_webhook_secret

  depends_on = [module.rds]
}

# ECSタスク定義の更新（Parameter Store使用）
resource "aws_ecs_task_definition" "app_with_rds" {
  family                   = "${var.project}-app-with-rds"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role_updated.arn
  task_role_arn           = aws_iam_role.ecs_task_role_updated.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project}-backend"
      image = "${aws_ecr_repository.backend.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      secrets = [
        {
          name      = "CLERK_SECRET_KEY"
          valueFrom = module.ssm.parameter_names.clerk_secret_key
        },
        {
          name      = "CLERK_WEBHOOK_SECRET"
          valueFrom = module.ssm.parameter_names.clerk_webhook_secret
        },
        {
          name      = "DATABASE_URL"
          valueFrom = module.ssm.parameter_names.database_url
        },
        {
          name      = "GEMINI_API_KEY"
          valueFrom = module.ssm.parameter_names.gemini_api_key
        },
        {
          name      = "STRIPE_SECRET_KEY"
          valueFrom = module.ssm.parameter_names.stripe_secret_key
        },
        {
          name      = "STRIPE_WEBHOOK_SECRET"
          valueFrom = module.ssm.parameter_names.stripe_webhook_secret
        }
      ]

      environment = [
        {
          name  = "STRIPE_PUBLISHABLE_KEY"
          value = var.stripe_publishable_key
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project}-backend"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      essential = true
    }
  ])

  depends_on = [module.rds, module.ssm]
}

# 更新されたECSタスク実行ロール（SSMアクセス権限付き）
resource "aws_iam_role" "ecs_task_execution_role_updated" {
  name = "${var.project}-ecs-task-execution-role-updated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_updated" {
  role       = aws_iam_role.ecs_task_execution_role_updated.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# SSMアクセス権限
resource "aws_iam_role_policy" "ecs_task_execution_ssm_policy" {
  name = "${var.project}-ecs-task-execution-ssm-policy"
  role = aws_iam_role.ecs_task_execution_role_updated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/${var.project}/${var.environment}/*"
      }
    ]
  })
}

# 更新されたECSタスクロール
resource "aws_iam_role" "ecs_task_role_updated" {
  name = "${var.project}-ecs-task-role-updated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task_role_policy_updated" {
  name = "${var.project}-ecs-task-role-policy-updated"
  role = aws_iam_role.ecs_task_role_updated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# ECSサービスの更新
resource "aws_ecs_service" "app_with_rds" {
  name            = "${var.project}-backend-v2"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.app_with_rds.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [module.ecs.ecs_security_group_id]
    subnets          = module.network.public_subnet_ids
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = module.alb.target_group_arn
    container_name   = "${var.project}-backend"
    container_port   = var.container_port
  }

  depends_on = [module.alb, aws_ecs_task_definition.app_with_rds]

  lifecycle {
    ignore_changes = [task_definition]
  }
}

# Route 53とACM証明書は後で追加
# resource "aws_route53_zone" "main" {
#   name = var.domain_name
# }

# resource "aws_acm_certificate" "main" {
#   domain_name       = var.domain_name
#   validation_method = "DNS"
#   lifecycle {
#     create_before_destroy = true
#   }
# }

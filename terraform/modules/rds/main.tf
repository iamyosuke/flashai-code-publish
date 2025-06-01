# RDS サブネットグループ
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project}-db-subnet-group"
  }
}

# RDS セキュリティグループ
resource "aws_security_group" "rds" {
  name_prefix = "${var.project}-rds-"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-rds-sg"
  }
}

# RDS セキュリティグループルール（ECSからの接続を許可）
resource "aws_security_group_rule" "rds_ingress_from_ecs" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = var.ecs_security_group_id
  security_group_id        = aws_security_group.rds.id
}

# RDS パラメータグループ
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${var.project}-postgres15"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name = "${var.project}-postgres15"
  }
}

# RDS 監視用IAMロール
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# RDS インスタンス
resource "aws_db_instance" "main" {
  identifier = "${var.project}-postgres"

  # エンジン設定
  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  # ストレージ設定
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true

  # データベース設定
  db_name  = var.database_name
  username = var.database_username
  password = var.database_password

  # ネットワーク設定
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # バックアップ設定
  backup_retention_period = 0
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # 監視設定
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # パラメータグループ
  parameter_group_name = aws_db_parameter_group.main.name

  # 削除保護
  deletion_protection = false
  skip_final_snapshot = true
  final_snapshot_identifier = null

  tags = {
    Name = "${var.project}-postgres"
  }
}

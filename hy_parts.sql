CREATE DATABASE  IF NOT EXISTS `hy` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `hy`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: hy
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `parts`
--

DROP TABLE IF EXISTS `parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `val` longtext NOT NULL,
  `watt` longtext,
  `tolerance` longtext,
  `package` longtext,
  `type` longtext,
  `buy_date` longtext,
  `quantity` int DEFAULT NULL,
  `dollar_price` longtext,
  `reason` longtext,
  `image_path` longtext,
  `min_quantity` int DEFAULT NULL,
  `usd_rate` double DEFAULT NULL,
  `vendor_name` longtext,
  `toman_price` double DEFAULT NULL,
  `last_modified_by` longtext,
  `storage_location` longtext,
  `tech` longtext,
  `purchase_links` longtext,
  `invoice_number` longtext,
  `entry_date` longtext,
  `part_code` longtext,
  `list5` longtext,
  `list6` longtext,
  `list7` longtext,
  `list8` longtext,
  `list9` longtext,
  `list10` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parts`
--

LOCK TABLES `parts` WRITE;
/*!40000 ALTER TABLE `parts` DISABLE KEYS */;
INSERT INTO `parts` VALUES (2,'1R','50W','1%','0805','Resistor','۱۴۰۴/۹/۱۵',48,'0.0','جججج','',1,55000,'جوان الکترونیک',30,'admin','A3','','[]',NULL,'2025-12-23 13:33:30','RES000000002',NULL,NULL,NULL,NULL,NULL,NULL),(3,'1k','1/4W','1%','0805','Resistor','۱۴۰۴/۹/۱۵',500,'11.0','اتتت444','',1,55000,'ECA',10,'admin','A2','',NULL,NULL,NULL,'RES000000003',NULL,NULL,NULL,NULL,NULL,NULL),(4,'50k','1/20W','0.01%','01005 (SMD)','Resistor','۱۴۰۴/۹/۱۵',900,'102000.0','66666666666','',10,121000,'ECA',156,'admin','A1','',NULL,NULL,NULL,'RES000000004',NULL,NULL,NULL,NULL,NULL,NULL),(6,'0R','1/10W','1%','2512','Resistor','۱۴۰۴/۹/۲۲',28,NULL,' [اصلاح: پارامتر:  -> 1/10W]',NULL,3,55000,'جوان الکترونیک',300,'admin','B1','Thin Film','[]',NULL,'2025-12-30 15:07:08','RES000000006','','','','','',''),(9,'1k','5W','','DIP','Resistor','۱۴۰۴/۹/۱۵',75,NULL,'انبار قبلی [اصلاح: پارامتر:  -> 5W] [اصلاح: آدرس: A3 -> B1]',NULL,10,55000,'ECA',110,'admin','B1','','[]',NULL,'2025-12-30 14:46:58','RES000000007','','','','','',''),(11,'2n2222','Small Signal','','SOT-23','Transistor','۱۴۰۴/۹/۲۴',87,NULL,'',NULL,10,135000,'جوان الکترونیک',1500,'admin','B1','BJT (NPN)','[]',NULL,NULL,'__T000000001',NULL,NULL,NULL,NULL,NULL,NULL),(12,'100nF','','','0805','Capacitor','۱۴۰۴/۹/۲۵',98,NULL,'',NULL,200,50000,'جوان الکترونیک',200,'admin','B1','','[\"https://www.javanelec.com/shop?searchfilter=100n#dtl/4185\"]',NULL,NULL,'CAP000000003',NULL,NULL,NULL,NULL,NULL,NULL),(13,'1M','2W','0.5%','DIP','Resistor','۱۴۰۴/۹/۲۷',339,NULL,'ضضضضضضضضضض [اصلاح: پارامتر: 1/4W -> 2W]',NULL,100,130000,'ECA',100,'admin','B1','Thin Film','[]',NULL,'2025-12-25 16:49:11','RES000000008','1','','','','',''),(16,'47nF','400V','0.25%','0402','Capacitor','۱۴۰۴/۱۰/۳',74,NULL,'',NULL,10,100000,'جوان الکترونیک',100,'admin','A3','','[]','','2025-12-24 19:31:25','CAP000000004','','','','','',''),(21,'47pF','200V','','Radial','Capacitor','۱۴۰۴/۱۰/۳',40,NULL,'',NULL,10,40000,'جوان الکترونیک',40,'admin','B1','','[]','','2025-12-24 19:59:37','CAP000000005','','','','','',''),(24,'10nF','1kV','10%','Radial','Capacitor','۱۴۰۴/۹/۲۳',5,NULL,'',NULL,10,55000,'ECA',100,'admin','B1','Polymer','[]',NULL,'2025-12-25 15:30:44','CAP000000002','','','','','',''),(27,'10mm','','mm','F-M','اسپیسر(Spacer)','۱۴۰۴/۱۰/۴',100,NULL,' [اصلاح: تعداد: 10 -> 100]',NULL,5,120000,'ECA',1500,'admin','A1','','[]','','2025-12-25 17:46:35','SPA000000001','','','','','',''),(29,'12k','10W','1','DIP','Resistor','۱۴۰۴/۱۰/۶',0,NULL,'',NULL,1,130000,'ECA',5000,'admin','A2','Thick Film','[]','','2025-12-31 12:58:53','RES000000009','','','','','','');
/*!40000 ALTER TABLE `parts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-31 16:47:49

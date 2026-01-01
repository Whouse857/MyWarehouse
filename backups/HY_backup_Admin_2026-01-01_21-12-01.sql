-- MySQL dump 10.13  Distrib 8.4.6, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: HY
-- ------------------------------------------------------
-- Server version	8.4.6

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_config`
--

DROP TABLE IF EXISTS `app_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_config` (
  `key` varchar(255) NOT NULL,
  `value` longtext,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_config`
--

LOCK TABLES `app_config` WRITE;
/*!40000 ALTER TABLE `app_config` DISABLE KEYS */;
INSERT INTO `app_config` VALUES ('component_config','{\"Capacitor\": {\"fields\": {\"list10\": {\"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"visible\": false}, \"list8\": {\"visible\": false}, \"list9\": {\"visible\": false}, \"packages\": {\"label\": \"\\u067e\\u06a9\\u06cc\\u062c\\u200c\", \"required\": false, \"visible\": true}, \"paramOptions\": {\"label\": \"\\u0648\\u0644\\u062a\\u0627\\u0698\", \"required\": true, \"visible\": true}, \"tolerances\": {\"label\": \"\\u062a\\u0648\\u0644\\u0631\\u0627\\u0646\\u0633(%)\"}}, \"icon\": \"battery\", \"label\": \"\\u062e\\u0627\\u0632\\u0646 (Capacitor)\", \"list5\": [\"1\", \"2\"], \"packages\": [\"0402\", \"0603\", \"0805\", \"1206\", \"1210\", \"Radial\", \"SMD Can (V-Chip)\", \"Snap-in\", \"Axial\"], \"paramLabel\": \"\\u0648\\u0644\\u062a\\u0627\\u0698 (Voltage)\", \"paramOptions\": [\"4V\", \"6.3V\", \"10V\", \"16V\", \"25V\", \"35V\", \"50V\", \"63V\", \"100V\", \"200V\", \"250V\", \"400V\", \"450V\", \"630V\", \"1kV\"], \"prefix\": \"CAP\", \"priority\": 8, \"techs\": [\"Ceramic (MLCC) X7R\", \"Ceramic (MLCC) C0G/NP0\", \"Ceramic (MLCC) X5R\", \"Electrolytic\", \"Tantalum\", \"Polymer\", \"Film\"], \"tolerances\": [\"10\", \"20\"], \"units\": [\"pF\", \"nF\", \"uF\", \"mF\", \"F\"]}, \"Connector\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}}, \"icon\": \"plug\", \"label\": \"\\u06a9\\u0627\\u0646\\u06a9\\u062a\\u0648\\u0631 (Connector)\", \"packages\": [\"Through Hole\", \"SMD\", \"Right Angle\"], \"paramLabel\": \"Pitch\", \"paramOptions\": [\"1.27mm\", \"2.0mm\", \"2.54mm\", \"3.81mm\", \"5.08mm\"], \"prefix\": \"CON\", \"priority\": 3, \"techs\": [\"Header\", \"Terminal Block\", \"USB\", \"Jack\", \"Socket\"], \"units\": [\"Pin\"]}, \"Diode\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}}, \"icon\": \"arrow-right-circle\", \"label\": \"\\u062f\\u06cc\\u0648\\u062f (Diode)\", \"packages\": [\"SOD-123\", \"SOD-323\", \"SMA\", \"SMB\", \"SMC\", \"DO-35\", \"DO-41\", \"TO-220\"], \"paramLabel\": \"\\u0648\\u0644\\u062a\\u0627\\u0698/\\u062c\\u0631\\u06cc\\u0627\\u0646\", \"paramOptions\": [\"Low Power\", \"High Speed\", \"Schottky\", \"Zener\"], \"prefix\": \"__D\", \"priority\": 6, \"techs\": [\"Rectifier\", \"Zener\", \"Schottky\", \"Switching\", \"TVS\", \"Bridge\", \"LED\"], \"units\": [\"-\"]}, \"General\": {\"fields\": {\"locations\": {\"required\": true, \"visible\": true}}, \"icon\": \"settings\", \"label\": \"\\u062a\\u0646\\u0638\\u06cc\\u0645\\u0627\\u062a \\u0639\\u0645\\u0648\\u0645\\u06cc (General)\", \"locations\": [\"A1\", \"A2\", \"B1\", \"A3\"], \"packages\": [], \"paramOptions\": [], \"priority\": 1, \"techs\": [], \"units\": []}, \"IC\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}}, \"icon\": \"box-select\", \"label\": \"\\u0622\\u06cc\\u200c\\u0633\\u06cc (IC)\", \"packages\": [\"SOIC-8\", \"SOIC-16\", \"TSSOP\", \"QFP\", \"QFN\", \"BGA\", \"DIP-8\", \"DIP-16\"], \"paramLabel\": \"\\u0646\\u0648\\u0639 \\u067e\\u06a9\\u06cc\\u062c\", \"paramOptions\": [\"DIP\", \"SMD\"], \"prefix\": \"_IC\", \"priority\": 5, \"techs\": [\"Microcontroller\", \"Op-Amp\", \"Regulator\", \"Memory\", \"Logic\", \"Driver\", \"Sensor\"], \"units\": [\"-\"]}, \"Inductor\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}, \"packages\": {\"label\": \"\\u067e\\u06a9\\u06cc\\u062c\", \"required\": true, \"visible\": true}, \"paramOptions\": {\"label\": \"\\u062c\\u0631\\u06cc\\u0627\\u0646\", \"required\": true, \"visible\": true}, \"units\": {\"required\": true, \"visible\": true}}, \"icon\": \"waves\", \"label\": \"\\u0633\\u0644\\u0641 (Inductor)\", \"packages\": [\"0402\", \"0603\", \"0805\", \"1206\", \"CDRH\", \"Power SMD\", \"Toroidal\", \"Axial\"], \"paramLabel\": \"\\u062c\\u0631\\u06cc\\u0627\\u0646 (Current)\", \"paramOptions\": [\"100mA\", \"250mA\", \"500mA\", \"1A\", \"2A\", \"3A\", \"5A\", \"10A\"], \"prefix\": \"__L\", \"priority\": 7, \"techs\": [\"Ferrite Bead\", \"Multilayer\", \"Wirewound\", \"Power Inductor\", \"Air Core\", \"Shielded\"], \"units\": [\"nH\", \"uH\", \"mH\", \"H\"]}, \"Resistor\": {\"fields\": {\"list10\": {\"visible\": false}, \"list5\": {\"label\": \"\\u0634\\u0634\\u0634\", \"required\": false, \"visible\": false}, \"list6\": {\"visible\": false}, \"list7\": {\"label\": \"\\u0641\\u06cc\\u0644\\u062f  12\", \"visible\": false}, \"list8\": {\"visible\": false}, \"list9\": {\"visible\": false}, \"packages\": {\"label\": \"\\u067e\\u06a9\\u06cc\\u062c\\u200c\", \"required\": false, \"visible\": true}, \"paramOptions\": {\"label\": \"\\u062a\\u0648\\u0627\\u0646\", \"required\": true, \"visible\": true}, \"tolerances\": {\"label\": \"\\u062a\\u0648\\u0644\\u0631\\u0627\\u0646\\u0633(%)\"}, \"units\": {\"required\": true, \"visible\": true}}, \"icon\": \"zap\", \"label\": \"\\u0645\\u0642\\u0627\\u0648\\u0645\\u062a (Resistor)\", \"list5\": [\"1\", \"2\"], \"packages\": [\"0201\", \"0402\", \"0603\", \"0805\", \"1206\", \"1210\", \"2010\", \"2512\", \"DIP\"], \"paramLabel\": \"\\u062a\\u0648\\u0627\\u0646 (Watt)\", \"paramOptions\": [\"1/10W\", \"1/8W\", \"1/4W\", \"1/2W\", \"1W\", \"2W\", \"3W\", \"5W\", \"10W\", \"20W\"], \"prefix\": \"RES\", \"priority\": 9, \"techs\": [\"General Purpose\", \"Precision\", \"Thin Film\", \"Thick Film\", \"Wirewound\", \"Metal Oxide\", \"Carbon Film\"], \"tolerances\": [\"1%\", \"2%\"], \"units\": [\"R\", \"k\", \"M\"]}, \"Transistor\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}}, \"icon\": \"cpu\", \"label\": \"\\u062a\\u0631\\u0627\\u0646\\u0632\\u06cc\\u0633\\u062a\\u0648\\u0631 (Transistor)\", \"packages\": [\"SOT-23\", \"SOT-223\", \"TO-92\", \"TO-220\", \"DPAK\", \"D2PAK\"], \"paramLabel\": \"Rating\", \"paramOptions\": [\"Small Signal\", \"Power\"], \"prefix\": \"__T\", \"priority\": 4, \"techs\": [\"BJT (NPN)\", \"BJT (PNP)\", \"MOSFET (N-Ch)\", \"MOSFET (P-Ch)\", \"IGBT\", \"JFET\"], \"units\": [\"-\"]}, \"\\u0627\\u0633\\u067e\\u06cc\\u0633\\u0631(Spacer)\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}, \"packages\": {\"label\": \"\", \"required\": true, \"visible\": true}, \"paramOptions\": {\"required\": false, \"visible\": false}, \"techs\": {\"required\": false, \"visible\": false}, \"tolerances\": {\"label\": \"\\u0631\\u0632\\u0648\\u0647\", \"required\": true, \"visible\": true}, \"units\": {\"required\": true, \"visible\": true}}, \"icon\": \"box\", \"label\": \"\\u0627\\u0633\\u067e\\u06cc\\u0633\\u0631(Spacer)\", \"list10\": [], \"list5\": [], \"list6\": [], \"list7\": [], \"list8\": [], \"list9\": [], \"packages\": [\"F-F\", \"F-M\"], \"paramLabel\": \"Parameter\", \"paramOptions\": [], \"prefix\": \"SPA\", \"priority\": 2, \"techs\": [], \"tolerances\": [\"mm\", \"inch\"], \"units\": [\"mm\"]}}'),('last_usd_info','{\"price\": 135565.0, \"date_str\": \"2026-01-01\", \"status\": \"online\"}'),('usd_info','{\"price\": 135565, \"date_str\": \"2025-12-31\", \"status\": \"online\"}');
/*!40000 ALTER TABLE `app_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` longtext NOT NULL,
  `phone` longtext,
  `email` longtext,
  `notes` longtext,
  `mobile` longtext,
  `fax` longtext,
  `website` longtext,
  `address` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,'جوان الکترونیک','02166757976','info@javanelec.com','','0912000000','02166728027','https://www.javanelec.com','تهران - خیابان جمهوری - بعد از پل حافظ - پاساژ عباسیان - طبقه همکف - پلاک 17'),(2,'ECA','04151388888','eshop.eca@gmail.com','** کلیه امور مربوط به پیگیری سفارش‌های اینترنتی، استعلام قیمت کالاها و خدمات پشتیبانی فروشگاه آنلاین از طریق دفتر مرکزی تبریز انجام می‌پذیرد.\nتهران، خیابان جمهوری، نرسیده به پل حافظ،\nپاساژ توکل، طبقه زیرهمکف، واحد B6 (تاپ ترونیک)','','','https://eshop.eca.ir','تبریز، چهارراه شریعتی، مجتمع تجاری گلستان، واحد ۷');
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `version` longtext,
  `applied_at` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

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
INSERT INTO `parts` VALUES (2,'1R','50W','1%','0805','Resistor','۱۴۰۴/۹/۱۵',48,'0.0','جججج','',1,55000,'جوان الکترونیک',30,'admin','A3','','[]',NULL,'2025-12-23 13:33:30','RES000000002',NULL,NULL,NULL,NULL,NULL,NULL),(3,'1k','1/4W','1%','0805','Resistor','۱۴۰۴/۹/۱۵',500,'11.0','اتتت444','',1,55000,'ECA',10,'admin','A2','',NULL,NULL,NULL,'RES000000003',NULL,NULL,NULL,NULL,NULL,NULL),(4,'50k','1/20W','0.01%','01005 (SMD)','Resistor','۱۴۰۴/۹/۱۵',900,'102000.0','66666666666','',10,121000,'ECA',156,'admin','A1','','[]',NULL,'2026-01-01 21:00:50','RES000000004','','','','','',''),(6,'0R','1/10W','1%','2512','Resistor','۱۴۰۴/۹/۲۲',28,NULL,' [اصلاح: پارامتر:  -> 1/10W]',NULL,3,55000,'جوان الکترونیک',300,'admin','B1','Thin Film','[]',NULL,'2026-01-01 20:32:58','RES000000006','','','','','',''),(9,'1k','5W','2%','DIP','Resistor','۱۴۰۴/۹/۱۵',101,NULL,'انبار قبلی',NULL,10,55000,'جوان الکترونیک',110,'admin','B1','Precision','[]',NULL,'2026-01-01 21:02:59','RES000000007','','','','','',''),(11,'2n2222','Small Signal','','SOT-23','Transistor','۱۴۰۴/۹/۲۴',87,NULL,'',NULL,10,135000,'جوان الکترونیک',1500,'admin','B1','BJT (NPN)','[]',NULL,NULL,'__T000000001',NULL,NULL,NULL,NULL,NULL,NULL),(12,'100nF','','','0805','Capacitor','۱۴۰۴/۹/۲۵',98,NULL,'',NULL,200,50000,'جوان الکترونیک',200,'admin','B1','','[\"https://www.javanelec.com/shop?searchfilter=100n#dtl/4185\"]',NULL,NULL,'CAP000000003',NULL,NULL,NULL,NULL,NULL,NULL),(13,'1M','2W','1%','DIP','Resistor','۱۴۰۴/۹/۲۷',309,NULL,'ضضضضضضضضضض [اصلاح: پارامتر: 1/4W -> 2W]',NULL,100,130000,'ECA',100,'admin','B1','Thin Film','[]',NULL,'2026-01-01 20:31:13','RES000000008','1','','','','',''),(16,'47nF','400V','0.25%','0402','Capacitor','۱۴۰۴/۱۰/۳',74,NULL,'',NULL,10,100000,'جوان الکترونیک',100,'admin','A3','','[]','','2025-12-24 19:31:25','CAP000000004','','','','','',''),(21,'47pF','200V','','Radial','Capacitor','۱۴۰۴/۱۰/۳',40,NULL,'',NULL,10,40000,'جوان الکترونیک',40,'admin','B1','','[]','','2025-12-24 19:59:37','CAP000000005','','','','','',''),(24,'10nF','1kV','10%','Radial','Capacitor','۱۴۰۴/۹/۲۳',5,NULL,'',NULL,10,55000,'ECA',100,'admin','B1','Polymer','[]',NULL,'2025-12-25 15:30:44','CAP000000002','','','','','',''),(27,'10mm','','mm','F-M','اسپیسر(Spacer)','۱۴۰۴/۱۰/۴',100,NULL,' [اصلاح: تعداد: 10 -> 100]',NULL,5,120000,'ECA',1500,'admin','A1','','[]','','2025-12-25 17:46:35','SPA000000001','','','','','','');
/*!40000 ALTER TABLE `parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_log`
--

DROP TABLE IF EXISTS `purchase_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `part_id` int NOT NULL,
  `val` longtext NOT NULL,
  `quantity_added` int NOT NULL,
  `unit_price` double DEFAULT NULL,
  `usd_rate` double DEFAULT NULL,
  `vendor_name` longtext,
  `purchase_date` longtext,
  `reason` longtext,
  `operation_type` longtext,
  `timestamp` longtext,
  `username` longtext,
  `watt` longtext,
  `tolerance` longtext,
  `package` longtext,
  `type` longtext,
  `storage_location` longtext,
  `tech` longtext,
  `invoice_number` longtext,
  `part_code` longtext,
  `list5` longtext,
  `list6` longtext,
  `list7` longtext,
  `list8` longtext,
  `list9` longtext,
  `list10` longtext,
  `edit_reason` longtext,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_log`
--

LOCK TABLES `purchase_log` WRITE;
/*!40000 ALTER TABLE `purchase_log` DISABLE KEYS */;
INSERT INTO `purchase_log` VALUES (126,13,'1M',0,100,130000,'ECA','۱۴۰۴/۹/۲۷','ضضضضضضضضضض [اصلاح: پارامتر: 1/4W -> 2W]','UPDATE (Edit)','2026-01-01 20:31:13','admin','2W','1%','DIP','Resistor','B1','Thin Film',NULL,'RES000000008','1','','','','','','تولرانس: 2% -> 1%'),(127,29,'12k',-1,5000,130000,'ECA','1404/10/11','چچچچچچچچچچ','EXIT (Project)','2026-01-01 20:31:31','admin','10W','1','0402','Resistor','A2','Thick Film','','RES000000009','','','','','','','موجودی: 19 -> 18'),(131,29,'12k',0,5000,130000,'ECA','۱۴۰۴/۱۰/۶','حذف قطعه از انبار','DELETE','2026-01-01 21:01:37','admin','10W','1','0402','Resistor','A2','Thick Film','','RES000000009','','','','','','',''),(132,9,'1k',25,110,55000,'جوان الکترونیک','۱۴۰۴/۹/۱۵','انبار قبلی','ENTRY (Refill)','2026-01-01 21:02:12','admin','5W','2%','DIP','Resistor','B1','Precision',NULL,'RES000000007','','','','','','','موجودی: 75 -> 100 | تولرانس: 2% | تکنولوژی: Precision | فروشنده: ECA -> جوان الکترونیک | دلیل خرید/پروژه: انبار قبلی [اصلاح: پارامتر:  -> 5W] [اصلاح: آدرس: A3 -> B1] -> انبار قبلی'),(133,9,'1k',1,110,55000,'جوان الکترونیک','۱۴۰۴/۹/۱۵','انبار قبلی','ENTRY (Refill)','2026-01-01 21:02:59','admin','5W','2%','DIP','Resistor','B1','Precision',NULL,'RES000000007','','','','','','','موجودی: 100 -> 101'),(134,13,'1M',-30,100,130000,'ECA','1404/10/11','666666666','EXIT (Project)','2026-01-01 21:03:27','admin','2W','1%','DIP','Resistor','B1','Thin Film',NULL,'RES000000008','1','','','','','','موجودی: 339 -> 309');
/*!40000 ALTER TABLE `purchase_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` longtext NOT NULL,
  `password` longtext NOT NULL,
  `role` longtext,
  `created_at` longtext,
  `full_name` longtext,
  `mobile` longtext,
  `permissions` longtext,
  `job_title` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918','admin','2025-12-06 20:27:42','حامد سرگلی','09126368924','{\"entry\": true, \"withdraw\": true, \"inventory\": true, \"contacts\": true, \"log\": true, \"users\": true, \"management\": true, \"backup\": true, \"server\": true}',NULL),(5,'test','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','operator','2025-12-16 19:54:20','ضضضقق','091211222212','{\"entry\": true, \"withdraw\": true, \"inventory\": true, \"contacts\": false, \"log\": false, \"users\": false, \"management\": false, \"backup\": false}',NULL),(6,'t','6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b','operator','2025-12-17 10:49:13','','','{\"entry\": true}',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-01 21:12:01

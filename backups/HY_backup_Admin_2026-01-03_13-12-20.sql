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
INSERT INTO `app_config` VALUES ('component_config','{\"Capacitor\": {\"fields\": {\"list10\": {\"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"visible\": false}, \"list8\": {\"visible\": false}, \"list9\": {\"visible\": false}, \"packages\": {\"label\": \"\\u067e\\u06a9\\u06cc\\u062c\\u200c\", \"required\": false, \"visible\": true}, \"paramOptions\": {\"label\": \"\\u0648\\u0644\\u062a\\u0627\\u0698\", \"required\": true, \"visible\": true}, \"tolerances\": {\"label\": \"\\u062a\\u0648\\u0644\\u0631\\u0627\\u0646\\u0633(%)\"}}, \"icon\": \"battery\", \"label\": \"\\u062e\\u0627\\u0632\\u0646 (Capacitor)\", \"list5\": [\"1\", \"2\"], \"packages\": [\"0402\", \"0603\", \"0805\", \"1206\", \"1210\", \"Radial\", \"SMD Can (V-Chip)\", \"Snap-in\", \"Axial\"], \"paramLabel\": \"\\u0648\\u0644\\u062a\\u0627\\u0698 (Voltage)\", \"paramOptions\": [\"4V\", \"6.3V\", \"10V\", \"16V\", \"25V\", \"35V\", \"50V\", \"63V\", \"100V\", \"200V\", \"250V\", \"400V\", \"450V\", \"630V\", \"1kV\"], \"prefix\": \"CAP\", \"priority\": 9, \"techs\": [\"Ceramic (MLCC) X7R\", \"Ceramic (MLCC) C0G/NP0\", \"Ceramic (MLCC) X5R\", \"Electrolytic\", \"Tantalum\", \"Polymer\", \"Film\"], \"tolerances\": [\"10\", \"20\"], \"units\": [\"pF\", \"nF\", \"uF\", \"mF\", \"F\"]}, \"Connector\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}}, \"icon\": \"plug\", \"label\": \"\\u06a9\\u0627\\u0646\\u06a9\\u062a\\u0648\\u0631 (Connector)\", \"packages\": [\"Through Hole\", \"SMD\", \"Right Angle\"], \"paramLabel\": \"Pitch\", \"paramOptions\": [\"1.27mm\", \"2.0mm\", \"2.54mm\", \"3.81mm\", \"5.08mm\"], \"prefix\": \"CON\", \"priority\": 3, \"techs\": [\"Header\", \"Terminal Block\", \"USB\", \"Jack\", \"Socket\"], \"units\": [\"Pin\"]}, \"Diode\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}, \"units\": {\"required\": true, \"visible\": true}}, \"icon\": \"arrow-right-circle\", \"label\": \"\\u062f\\u06cc\\u0648\\u062f (Diode)\", \"packages\": [\"SOD-123\", \"SOD-323\", \"SMA\", \"SMB\", \"SMC\", \"DO-35\", \"DO-41\", \"TO-220\"], \"paramLabel\": \"\\u0648\\u0644\\u062a\\u0627\\u0698/\\u062c\\u0631\\u06cc\\u0627\\u0646\", \"paramOptions\": [\"Low Power\", \"High Speed\", \"Schottky\", \"Zener\"], \"prefix\": \"__D\", \"priority\": 7, \"techs\": [\"Rectifier\", \"Zener\", \"Schottky\", \"Switching\", \"TVS\", \"Bridge\", \"LED\"], \"units\": [\"-\"]}, \"General\": {\"fields\": {\"locations\": {\"required\": true, \"visible\": true}}, \"icon\": \"settings\", \"label\": \"\\u062a\\u0646\\u0638\\u06cc\\u0645\\u0627\\u062a \\u0639\\u0645\\u0648\\u0645\\u06cc (General)\", \"locations\": [\"A1\", \"A2\", \"B1\", \"A3\", \"1L\", \"2L\"], \"packages\": [], \"paramOptions\": [], \"priority\": 1, \"techs\": [], \"units\": []}, \"IC\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}}, \"icon\": \"box-select\", \"label\": \"\\u0622\\u06cc\\u200c\\u0633\\u06cc (IC)\", \"packages\": [\"SOIC-8\", \"SOIC-16\", \"TSSOP\", \"QFP\", \"QFN\", \"BGA\", \"DIP-8\", \"DIP-16\"], \"paramLabel\": \"\\u0646\\u0648\\u0639 \\u067e\\u06a9\\u06cc\\u062c\", \"paramOptions\": [\"DIP\", \"SMD\"], \"prefix\": \"_IC\", \"priority\": 6, \"techs\": [\"Microcontroller\", \"Op-Amp\", \"Regulator\", \"Memory\", \"Logic\", \"Driver\", \"Sensor\"], \"units\": [\"-\"]}, \"Inductor\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}, \"packages\": {\"label\": \"\\u067e\\u06a9\\u06cc\\u062c\", \"required\": true, \"visible\": true}, \"paramOptions\": {\"label\": \"\\u062c\\u0631\\u06cc\\u0627\\u0646\", \"required\": true, \"visible\": true}, \"units\": {\"required\": true, \"visible\": true}}, \"icon\": \"waves\", \"label\": \"\\u0633\\u0644\\u0641 (Inductor)\", \"packages\": [\"0402\", \"0603\", \"0805\", \"1206\", \"CDRH\", \"Power SMD\", \"Toroidal\", \"Axial\"], \"paramLabel\": \"\\u062c\\u0631\\u06cc\\u0627\\u0646 (Current)\", \"paramOptions\": [\"100mA\", \"250mA\", \"500mA\", \"1A\", \"2A\", \"3A\", \"5A\", \"10A\"], \"prefix\": \"__L\", \"priority\": 8, \"techs\": [\"Ferrite Bead\", \"Multilayer\", \"Wirewound\", \"Power Inductor\", \"Air Core\", \"Shielded\"], \"units\": [\"nH\", \"uH\", \"mH\", \"H\"]}, \"Resistor\": {\"fields\": {\"list10\": {\"visible\": false}, \"list5\": {\"label\": \"\\u0634\\u0634\\u0634\", \"required\": false, \"visible\": false}, \"list6\": {\"visible\": false}, \"list7\": {\"label\": \"\\u0641\\u06cc\\u0644\\u062f  12\", \"visible\": false}, \"list8\": {\"visible\": false}, \"list9\": {\"visible\": false}, \"packages\": {\"label\": \"\\u067e\\u06a9\\u06cc\\u062c\\u200c\", \"required\": false, \"visible\": true}, \"paramOptions\": {\"label\": \"\\u062a\\u0648\\u0627\\u0646\", \"required\": true, \"visible\": true}, \"tolerances\": {\"label\": \"\\u062a\\u0648\\u0644\\u0631\\u0627\\u0646\\u0633(%)\"}, \"units\": {\"required\": true, \"visible\": true}}, \"icon\": \"zap\", \"label\": \"\\u0645\\u0642\\u0627\\u0648\\u0645\\u062a (Resistor)\", \"list5\": [\"1\", \"2\"], \"packages\": [\"0201\", \"0402\", \"0603\", \"0805\", \"1206\", \"1210\", \"2010\", \"2512\", \"DIP\"], \"paramLabel\": \"\\u062a\\u0648\\u0627\\u0646 (Watt)\", \"paramOptions\": [\"1/10W\", \"1/8W\", \"1/4W\", \"1/2W\", \"1W\", \"2W\", \"3W\", \"5W\", \"10W\", \"20W\"], \"prefix\": \"RES\", \"priority\": 10, \"techs\": [\"General Purpose\", \"Precision\", \"Thin Film\", \"Thick Film\", \"Wirewound\", \"Metal Oxide\", \"Carbon Film\"], \"tolerances\": [\"1%\", \"2%\"], \"units\": [\"R\", \"k\", \"M\"]}, \"Transistor\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}}, \"icon\": \"cpu\", \"label\": \"\\u062a\\u0631\\u0627\\u0646\\u0632\\u06cc\\u0633\\u062a\\u0648\\u0631 (Transistor)\", \"packages\": [\"SOT-23\", \"SOT-223\", \"TO-92\", \"TO-220\", \"DPAK\", \"D2PAK\"], \"paramLabel\": \"Rating\", \"paramOptions\": [\"Small Signal\", \"Power\"], \"prefix\": \"__T\", \"priority\": 5, \"techs\": [\"BJT (NPN)\", \"BJT (PNP)\", \"MOSFET (N-Ch)\", \"MOSFET (P-Ch)\", \"IGBT\", \"JFET\"], \"units\": [\"-\"]}, \"\\u0627\\u0633\\u067e\\u06cc\\u0633\\u0631(Spacer)\": {\"fields\": {\"list10\": {\"required\": false, \"visible\": false}, \"list5\": {\"required\": false, \"visible\": false}, \"list6\": {\"required\": false, \"visible\": false}, \"list7\": {\"required\": false, \"visible\": false}, \"list8\": {\"required\": false, \"visible\": false}, \"list9\": {\"required\": false, \"visible\": false}, \"packages\": {\"label\": \"\", \"required\": true, \"visible\": true}, \"paramOptions\": {\"required\": false, \"visible\": false}, \"techs\": {\"required\": false, \"visible\": false}, \"tolerances\": {\"label\": \"\\u0631\\u0632\\u0648\\u0647\", \"required\": true, \"visible\": true}, \"units\": {\"required\": true, \"visible\": true}}, \"icon\": \"box\", \"label\": \"\\u0627\\u0633\\u067e\\u06cc\\u0633\\u0631(Spacer)\", \"list10\": [], \"list5\": [], \"list6\": [], \"list7\": [], \"list8\": [], \"list9\": [], \"packages\": [\"F-F\", \"F-M\"], \"paramLabel\": \"Parameter\", \"paramOptions\": [], \"prefix\": \"SPA\", \"priority\": 2, \"techs\": [], \"tolerances\": [\"mm\", \"inch\"], \"units\": [\"mm\"]}, \"\\u062a\\u0631\\u0627\\u06cc\\u0627\\u06a9 \\u0648 \\u062a\\u0631\\u06cc\\u0633\\u062a\\u0648\\u0631\": {\"label\": \"\\u062a\\u0631\\u0627\\u06cc\\u0627\\u06a9 \\u0648 \\u062a\\u0631\\u06cc\\u0633\\u062a\\u0648\\u0631\", \"icon\": \"box\", \"tolerances\": [\"ORGINAL\", \"fake\", \"HIGH COPY\"], \"units\": [\"600V\", \"800V\", \"700V\"], \"packages\": [\"TO220\", \"TO-247AD (TO-3P)\"], \"techs\": [], \"paramOptions\": [\"TRIAC\", \"SCR\"], \"list5\": [], \"list6\": [], \"list7\": [], \"list8\": [], \"list9\": [], \"list10\": [], \"paramLabel\": \"Parameter\", \"priority\": 4, \"prefix\": \"SCR\", \"fields\": {\"units\": {\"label\": \"\\u0648\\u0644\\u062a\\u0627\\u0698\", \"required\": true, \"visible\": true}, \"paramOptions\": {\"label\": \"\\u0646\\u0648\\u0639\", \"required\": true, \"visible\": true}, \"techs\": {\"visible\": false, \"required\": false}, \"list5\": {\"visible\": false, \"required\": false}, \"list7\": {\"visible\": false, \"required\": false}, \"list6\": {\"visible\": false, \"required\": false}, \"list8\": {\"visible\": false, \"required\": false}, \"list9\": {\"visible\": false, \"required\": false}, \"list10\": {\"visible\": false, \"required\": false}, \"packages\": {\"required\": true, \"visible\": true}, \"tolerances\": {\"label\": \"\\u0627\\u0635\\u0644\\u06cc/\\u0647\\u0627\\u06cc \\u06a9\\u067e\\u06cc/\\u0641\\u06cc\\u06a9\", \"required\": true, \"visible\": true}}}}'),('last_usd_info','{\"price\": 135680.0, \"date_str\": \"2026-01-03\", \"status\": \"online\"}'),('usd_info','{\"price\": 135565, \"date_str\": \"2025-12-31\", \"status\": \"online\"}');
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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parts`
--

LOCK TABLES `parts` WRITE;
/*!40000 ALTER TABLE `parts` DISABLE KEYS */;
INSERT INTO `parts` VALUES (30,'BTA41-700B700V','TRIAC','HIGH COPY','TO-247AD (TO-3P)','ترایاک و تریستور','۱۴۰۴/۱۰/۱۳',0,NULL,'انبار گردانی',NULL,10,135000,'جوان الکترونیک',86200,'admin','2L','','[\"https://www.javanelec.com/shop?searchfilter=bta41#dtl/20097\"]','','2026-01-03 13:10:16','SCR000000001','','','','','','');
/*!40000 ALTER TABLE `parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_bom`
--

DROP TABLE IF EXISTS `project_bom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_bom` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `part_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_bom_project` (`project_id`),
  KEY `fk_bom_part` (`part_id`),
  CONSTRAINT `fk_bom_part` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bom_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_bom`
--

LOCK TABLES `project_bom` WRITE;
/*!40000 ALTER TABLE `project_bom` DISABLE KEYS */;
INSERT INTO `project_bom` VALUES (92,2,30,1,0);
/*!40000 ALTER TABLE `project_bom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_costs`
--

DROP TABLE IF EXISTS `project_costs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_costs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `cost` double DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_costs_project` (`project_id`),
  CONSTRAINT `fk_costs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_costs`
--

LOCK TABLES `project_costs` WRITE;
/*!40000 ALTER TABLE `project_costs` DISABLE KEYS */;
INSERT INTO `project_costs` VALUES (84,2,'هزینه مونتاژ',0.5),(85,2,'هزینه طراحی',0.2),(86,2,'هزینه بسته بندی',0.5);
/*!40000 ALTER TABLE `project_costs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_price_usd` double DEFAULT '0',
  `conversion_rate` double DEFAULT '0',
  `part_profit` double DEFAULT '0',
  `total_parts_count` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (2,'SSR','تولید محصول SSR  کامل','2026-01-03 11:42:31','2026-01-03 13:12:04',1.8385185185185184,20,10,1);
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_log`
--

LOCK TABLES `purchase_log` WRITE;
/*!40000 ALTER TABLE `purchase_log` DISABLE KEYS */;
INSERT INTO `purchase_log` VALUES (126,13,'1M',0,100,130000,'ECA','۱۴۰۴/۹/۲۷','ضضضضضضضضضض [اصلاح: پارامتر: 1/4W -> 2W]','UPDATE (Edit)','2026-01-01 20:31:13','admin','2W','1%','DIP','Resistor','B1','Thin Film',NULL,'RES000000008','1','','','','','','تولرانس: 2% -> 1%'),(127,29,'12k',-1,5000,130000,'ECA','1404/10/11','چچچچچچچچچچ','EXIT (Project)','2026-01-01 20:31:31','admin','10W','1','0402','Resistor','A2','Thick Film','','RES000000009','','','','','','','موجودی: 19 -> 18'),(132,9,'1k',25,110,55000,'جوان الکترونیک','۱۴۰۴/۹/۱۵','انبار قبلی','ENTRY (Refill)','2026-01-01 21:02:12','admin','5W','2%','DIP','Resistor','B1','Precision',NULL,'RES000000007','','','','','','','موجودی: 75 -> 100 | تولرانس: 2% | تکنولوژی: Precision | فروشنده: ECA -> جوان الکترونیک | دلیل خرید/پروژه: انبار قبلی [اصلاح: پارامتر:  -> 5W] [اصلاح: آدرس: A3 -> B1] -> انبار قبلی'),(133,9,'1k',1,110,55000,'جوان الکترونیک','۱۴۰۴/۹/۱۵','انبار قبلی','ENTRY (Refill)','2026-01-01 21:02:59','admin','5W','2%','DIP','Resistor','B1','Precision',NULL,'RES000000007','','','','','','','موجودی: 100 -> 101'),(134,13,'1M',-30,100,130000,'ECA','1404/10/11','666666666','EXIT (Project)','2026-01-01 21:03:27','admin','2W','1%','DIP','Resistor','B1','Thin Film',NULL,'RES000000008','1','','','','','','موجودی: 339 -> 309'),(135,2,'1R',0,30,55000,'جوان الکترونیک','۱۴۰۴/۹/۱۵','جججج','UPDATE (Edit)','2026-01-01 22:10:50','admin','50W','1%','DIP','Resistor','A3','Precision',NULL,'RES000000002','','','','','','','پکیج: 0805 -> DIP | تکنولوژی: Precision'),(136,13,'1M',0,100,130000,'ECA','۱۴۰۴/۹/۲۷','حذف قطعه از انبار','DELETE','2026-01-03 12:54:23','admin','2W','1%','DIP','Resistor','B1','Thin Film',NULL,'RES000000008','1','','','','','',''),(137,9,'1k',0,110,55000,'جوان الکترونیک','۱۴۰۴/۹/۱۵','حذف قطعه از انبار','DELETE','2026-01-03 12:54:25','admin','5W','2%','DIP','Resistor','B1','Precision',NULL,'RES000000007','','','','','','',''),(138,6,'0R',0,300,55000,'جوان الکترونیک','۱۴۰۴/۹/۲۲','حذف قطعه از انبار','DELETE','2026-01-03 12:54:27','admin','1/10W','1%','2512','Resistor','B1','Thin Film',NULL,'RES000000006','','','','','','',''),(139,4,'50k',0,156,121000,'ECA','۱۴۰۴/۹/۱۵','حذف قطعه از انبار','DELETE','2026-01-03 12:54:28','admin','1/20W','0.01%','01005 (SMD)','Resistor','A1','',NULL,'RES000000004','','','','','','',''),(140,3,'1k',0,10,55000,'ECA','۱۴۰۴/۹/۱۵','حذف قطعه از انبار','DELETE','2026-01-03 12:54:30','admin','1/4W','1%','0805','Resistor','A2','',NULL,'RES000000003',NULL,NULL,NULL,NULL,NULL,NULL,''),(141,2,'1R',0,30,55000,'جوان الکترونیک','۱۴۰۴/۹/۱۵','حذف قطعه از انبار','DELETE','2026-01-03 12:54:31','admin','50W','1%','DIP','Resistor','A3','Precision',NULL,'RES000000002','','','','','','',''),(142,24,'10nF',0,100,55000,'ECA','۱۴۰۴/۹/۲۳','حذف قطعه از انبار','DELETE','2026-01-03 12:54:38','admin','1kV','10%','Radial','Capacitor','B1','Polymer',NULL,'CAP000000002','','','','','','',''),(143,21,'47pF',0,40,40000,'جوان الکترونیک','۱۴۰۴/۱۰/۳','حذف قطعه از انبار','DELETE','2026-01-03 12:54:40','admin','200V','','Radial','Capacitor','B1','','','CAP000000005','','','','','','',''),(144,16,'47nF',0,100,100000,'جوان الکترونیک','۱۴۰۴/۱۰/۳','حذف قطعه از انبار','DELETE','2026-01-03 12:54:44','admin','400V','0.25%','0402','Capacitor','A3','','','CAP000000004','','','','','','',''),(145,12,'100nF',0,200,50000,'جوان الکترونیک','۱۴۰۴/۹/۲۵','حذف قطعه از انبار','DELETE','2026-01-03 12:54:47','admin','','','0805','Capacitor','B1','',NULL,'CAP000000003',NULL,NULL,NULL,NULL,NULL,NULL,''),(146,27,'10mm',0,1500,120000,'ECA','۱۴۰۴/۱۰/۴','حذف قطعه از انبار','DELETE','2026-01-03 12:54:51','admin','','mm','F-M','اسپیسر(Spacer)','A1','','','SPA000000001','','','','','','',''),(147,11,'2n2222',0,1500,135000,'جوان الکترونیک','۱۴۰۴/۹/۲۴','حذف قطعه از انبار','DELETE','2026-01-03 12:54:58','admin','Small Signal','','SOT-23','Transistor','B1','BJT (NPN)',NULL,'__T000000001',NULL,NULL,NULL,NULL,NULL,NULL,''),(148,30,'BTA41-700B700V',0,86200,135000,'جوان الکترونیک','۱۴۰۴/۱۰/۱۳','انبار گردانی','ENTRY (New)','2026-01-03 13:07:40','admin','TRIAC','HIGH COPY','TO220','ترایاک و تریستور','A1','','','SCR000000001','','','','','','','ثبت اولیه قطعه'),(149,30,'BTA41-700B700V',0,86200,135000,'جوان الکترونیک','۱۴۰۴/۱۰/۱۳','انبار گردانی','UPDATE (Edit)','2026-01-03 13:09:36','admin','TRIAC','HIGH COPY','TO-247AD (TO-3P)','ترایاک و تریستور','A1','','','SCR000000001','','','','','','','پکیج: TO220 -> TO-247AD (TO-3P)'),(150,30,'BTA41-700B700V',0,86200,135000,'جوان الکترونیک','۱۴۰۴/۱۰/۱۳','انبار گردانی','UPDATE (Edit)','2026-01-03 13:10:16','admin','TRIAC','HIGH COPY','TO-247AD (TO-3P)','ترایاک و تریستور','2L','','','SCR000000001','','','','','','','آدرس/محل نگهداری: A1 -> 2L');
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
INSERT INTO `users` VALUES (1,'admin','8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918','admin','2025-12-06 20:27:42','حامد سرگلی','09126368924','{\"entry\": true, \"withdraw\": true, \"inventory\": true, \"contacts\": true, \"log\": true, \"users\": true, \"management\": true, \"backup\": true, \"server\": true, \"projects\": true}',NULL),(5,'test','a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3','operator','2025-12-16 19:54:20','ضضضقق','091211222212','{\"entry\": true, \"withdraw\": true, \"inventory\": true, \"contacts\": false, \"log\": false, \"users\": false, \"management\": false, \"backup\": false}',NULL),(6,'t','6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b','operator','2025-12-17 10:49:13','','','{\"entry\": true}',NULL);
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

-- Dump completed on 2026-01-03 13:12:21

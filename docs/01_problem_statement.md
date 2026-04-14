# Phase I: Project Documentation

## 1. Problem Statement
During natural or man-made disasters, coordinating relief efforts, managing resources, and tracking affected populations is a complex logistical challenge. There is often a disconnect between non-governmental organizations (NGOs), government bodies, and on-ground volunteer networks, leading to misallocation of resources, overcrowded relief camps, and unequal distribution of aid to affected families. 

The **Disaster Relief Management System** aims to provide a centralized database solution to streamline emergency response operations. It will track disasters, manage relief camp operations and capacities, monitor live inventory of essential resources (like food, medicine, and clothing), coordinate volunteer deployment based on specialized skills, and ensure equitable aid distribution to affected families.

## 2. Database Requirement Analysis
Based on the problem statement, the system must fulfill the following operational requirements:
- **Disaster Tracking**: Ability to log disaster events, their locations, severity, and timelines.
- **Organization & Volunteer Management**: Track participating organizations and individual volunteers, including their skills, contact information, and current deployment locations.
- **Relief Camp Administration**: Manage the establishment of relief camps, track their exact locations, and monitor real-time capacity versus current occupancy.
- **Beneficiary Registration**: Register affected families seeking shelter, mapping them to specific camps, and identifying vulnerable members (elderly, disabled, young children) to prioritize aid.
- **Inventory & Resource Management**: Maintain a catalog of critical resources and track the available stock at each individual relief camp, alerting when quantities fall below a minimum threshold.
- **Aid Distribution Logging**: Keep an accurate ledger of what resources were given to which family, distributed by whom, and when, to ensure transparency and prevent hoarding.

These requirements mandate a relational structure handling entities such as `DISASTER`, `ORGANIZATION`, `RELIEF_CAMP`, `VOLUNTEER`, `AFFECTED_FAMILY`, `RESOURCE`, `CAMP_INVENTORY`, and `AID_DISTRIBUTION`.

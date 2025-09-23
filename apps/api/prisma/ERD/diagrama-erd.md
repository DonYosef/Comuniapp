# Diagrama Entidad-Relación - Comuniapp

Este archivo contiene el diagrama ERD de la aplicación Comuniapp en formato Mermaid.

```mermaid
erDiagram
    %% Entidades principales
    Organization {
        string id PK
        string name
        PlanType plan
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Community {
        string id PK
        string organizationId FK
        string name
        string address
        string description
        boolean isActive
        string createdById FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Unit {
        string id PK
        string number
        string floor
        UnitType type
        boolean isActive
        string communityId FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    User {
        string id PK
        string email UK
        string name
        string phone
        string passwordHash
        UserStatus status
        boolean isActive
        string organizationId FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Role {
        string id PK
        RoleName name UK
        string description
        string[] permissions
        datetime createdAt
        datetime updatedAt
    }

    %% Entidades de relaciones N:M
    UserRole {
        string id PK
        string userId FK
        string roleId FK
    }

    CommunityAdmin {
        string id PK
        string communityId FK
        string userId FK
        datetime createdAt
    }

    UserUnit {
        string id PK
        string userId FK
        string unitId FK
        UserUnitStatus status
        datetime confirmedAt
        datetime createdAt
        datetime updatedAt
    }

    %% Entidades de negocio
    Expense {
        string id PK
        string unitId FK
        decimal amount
        string concept
        string description
        datetime dueDate
        ExpenseStatus status
        datetime createdAt
        datetime updatedAt
    }

    Payment {
        string id PK
        string userId FK
        string expenseId FK
        decimal amount
        PaymentMethod method
        PaymentStatus status
        datetime paymentDate
        string reference
        datetime createdAt
        datetime updatedAt
    }

    Parcel {
        string id PK
        string unitId FK
        string description
        string sender
        datetime receivedAt
        datetime retrievedAt
        ParcelStatus status
        datetime createdAt
        datetime updatedAt
    }

    Visitor {
        string id PK
        string unitId FK
        string hostUserId FK
        string visitorName
        string visitorDocument
        string visitorPhone
        datetime entryDate
        datetime exitDate
        VisitorStatus status
        datetime createdAt
        datetime updatedAt
    }

    Announcement {
        string id PK
        string communityId FK
        string title
        string content
        AnnouncementType type
        boolean isActive
        datetime publishedAt
        datetime createdAt
        datetime updatedAt
    }

    Document {
        string id PK
        string communityId FK
        string name
        string description
        string fileUrl
        string fileType
        int fileSize
        DocumentCategory category
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Communication {
        string id PK
        string userId FK
        CommunicationType type
        string content
        datetime sentAt
        boolean read
        datetime createdAt
        datetime updatedAt
    }

    SpaceReservation {
        string id PK
        string unitId FK
        string space
        datetime reservationDate
        string startTime
        string endTime
        ReservationStatus status
        datetime createdAt
        datetime updatedAt
    }

    Incident {
        string id PK
        string userId FK
        string title
        string description
        IncidentStatus status
        datetime createdAt
        datetime closedAt
        datetime updatedAt
    }

    %% Relaciones principales
    Organization ||--o{ Community : "tiene"
    Organization ||--o{ User : "emplea"

    Community ||--o{ Unit : "contiene"
    Community ||--o{ Announcement : "publica"
    Community ||--o{ Document : "almacena"
    Community }o--o{ User : "admin"

    Unit ||--o{ Expense : "genera"
    Unit ||--o{ Parcel : "recibe"
    Unit ||--o{ Visitor : "registra"
    Unit ||--o{ SpaceReservation : "reserva"
    Unit }o--o{ User : "habitada_por"

    User ||--o{ UserRole : "tiene"
    Role ||--o{ UserRole : "asignado_a"

    User ||--o{ Payment : "realiza"
    User ||--o{ Communication : "recibe"
    User ||--o{ Incident : "reporta"
    User ||--o{ Visitor : "invita"

    Expense ||--o{ Payment : "pagado_con"
```

## Cómo Visualizar este Diagrama

### En VS Code:

1. Instala la extensión "Mermaid Preview"
2. Abre este archivo
3. Usa Ctrl+Shift+P y busca "Mermaid: Preview"

### En GitHub:

- Este diagrama se renderizará automáticamente al subirlo a GitHub

### En Mermaid Live Editor:

- Ve a https://mermaid.live/
- Copia y pega el código del diagrama
- Descarga como PNG, SVG o PDF

### En Herramientas Online:

- **Mermaid Chart:** https://www.mermaidchart.com/
- **Diagrams.net:** Importa el código Mermaid

## Información del Diagrama

- **Total de Entidades:** 16 entidades principales
- **Relaciones:** 13 relaciones entre entidades
- **Generado:** Basado en el schema.prisma actual
- **Formato:** Mermaid ERD (Entity Relationship Diagram)

import type { PrismaClient } from "@prisma/client";
import type {
  IDocumentRepository,
  DocumentRecord,
  DocumentWithOwner,
  DocumentStatusStats,
  DocumentType,
  DocumentStatus,
} from "../../application/ports/IDocumentRepository.js";

export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async getStatsByStatus(): Promise<DocumentStatusStats> {
    const [pending, approved, rejected] = await Promise.all([
      this.prismaClient.document.groupBy({ by: ["user_id"], where: { status: "pending"  } }),
      this.prismaClient.document.groupBy({ by: ["user_id"], where: { status: "approved" } }),
      this.prismaClient.document.groupBy({ by: ["user_id"], where: { status: "rejected" } }),
    ]);
    return {
      pending:  pending.length,
      approved: approved.length,
      rejected: rejected.length,
    };
  }

  async create(input: {
    userId:   string;
    type:     DocumentType;
    filePath: string;
    mimeType: string;
  }): Promise<DocumentRecord> {
    const createdDocument = await this.prismaClient.document.create({
      data: {
        user_id:   input.userId,
        type:      input.type,
        file_path: input.filePath,
        mime_type: input.mimeType,
      },
    });
    return this.toRecord(createdDocument);
  }

  async findByUserId(userId: string): Promise<DocumentRecord[]> {
    const documents = await this.prismaClient.document.findMany({
      where:   { user_id: userId },
      orderBy: { created_at: "desc" },
    });
    return documents.map((rawDocument) => this.toRecord(rawDocument));
  }

  async findAllPending(): Promise<DocumentWithOwner[]> {
    const documents = await this.prismaClient.document.findMany({
      where:   { status: "pending" },
      orderBy: { created_at: "asc" },
      include: { user: { select: { name: true, email: true } } },
    });

    return documents.map((rawDocument) => ({
      ...this.toRecord(rawDocument),
      ownerName:  rawDocument.user.name,
      ownerEmail: rawDocument.user.email,
    }));
  }

  async findAllByStatus(status: DocumentStatus): Promise<DocumentWithOwner[]> {
    const documents = await this.prismaClient.document.findMany({
      where:   { status },
      orderBy: { created_at: "desc" },
      include: { user: { select: { name: true, email: true } } },
    });
    return documents.map((rawDocument) => ({
      ...this.toRecord(rawDocument),
      ownerName:  rawDocument.user.name,
      ownerEmail: rawDocument.user.email,
    }));
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<DocumentRecord> {
    const updated = await this.prismaClient.document.update({
      where: { id },
      data:  { status },
    });
    return this.toRecord(updated);
  }

  private toRecord(rawDocument: {
    id:         string;
    user_id:    string;
    type:       string;
    file_path:  string;
    mime_type:  string;
    status:     string;
    created_at: Date;
  }): DocumentRecord {
    return {
      id:        rawDocument.id,
      userId:    rawDocument.user_id,
      type:      rawDocument.type as DocumentType,
      filePath:  rawDocument.file_path,
      mimeType:  rawDocument.mime_type,
      status:    rawDocument.status as DocumentStatus,
      createdAt: rawDocument.created_at,
    };
  }
}

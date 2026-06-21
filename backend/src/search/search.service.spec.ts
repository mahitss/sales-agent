/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('../prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn(),
  };
});

describe('SearchService', () => {
  let service: SearchService;

  const mockPrismaService = {
    lead: {
      findMany: jest.fn(),
    },
    companyEnrichment: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
    workflowExecution: {
      findMany: jest.fn(),
    },
    conversation: {
      findMany: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchAll', () => {
    it('should return empty results if query is empty or whitespace', async () => {
      const result = await service.searchAll('business-123', '   ');
      expect(result).toEqual({
        leads: [],
        companies: [],
        conversations: [],
        users: [],
        appointments: [],
        workflows: [],
      });
      expect(mockPrismaService.lead.findMany).not.toHaveBeenCalled();
    });

    it('should query all entities with correct tenant businessId and query term', async () => {
      const mockLeads = [
        { id: 'l1', name: 'John Doe', email: 'john@example.com' },
      ];
      const mockCompanies = [{ id: 'c1', companyName: 'Acme Corp' }];
      const mockUsers = [{ id: 'u1', name: 'Agent Smith' }];
      const mockAppts = [
        {
          id: 'a1',
          date: '2026-06-22',
          time: '10:00',
          lead: { name: 'John Doe' },
        },
      ];
      const mockWorkflows = [
        {
          id: 'w1',
          status: 'COMPLETED',
          workflow: { name: 'Trigger Outbound' },
        },
      ];
      const mockConversations = [
        { id: 'conv1', leadId: 'l1', channel: 'EMAIL', leadName: 'John Doe' },
      ];

      mockPrismaService.lead.findMany.mockResolvedValue(mockLeads);
      mockPrismaService.companyEnrichment.findMany.mockResolvedValue(
        mockCompanies,
      );
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.appointment.findMany.mockResolvedValue(mockAppts);
      mockPrismaService.workflowExecution.findMany.mockResolvedValue(
        mockWorkflows,
      );
      mockPrismaService.$queryRawUnsafe.mockResolvedValue(mockConversations);

      const query = 'john';
      const result = await service.searchAll('business-123', query);

      expect(mockPrismaService.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId: 'business-123',
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: { contains: query, mode: 'insensitive' },
              }),
            ]),
          }),
          take: 8,
        }),
      );

      expect(mockPrismaService.companyEnrichment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            lead: { businessId: 'business-123' },
          }),
          take: 8,
        }),
      );

      expect(mockPrismaService.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.id, c."leadId", c.channel'),
        'business-123',
        '%john%',
      );

      expect(result).toEqual({
        leads: mockLeads,
        companies: mockCompanies,
        users: mockUsers,
        appointments: mockAppts,
        workflows: mockWorkflows,
        conversations: [
          {
            id: 'conv1',
            leadId: 'l1',
            channel: 'EMAIL',
            leadName: 'John Doe',
          },
        ],
      });
    });

    it('should fall back to conversation.findMany if raw SQL query fails', async () => {
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.companyEnrichment.findMany.mockResolvedValue([]);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
      mockPrismaService.workflowExecution.findMany.mockResolvedValue([]);

      // Simulate raw query throwing an error (e.g. database schema is different/sqlite)
      mockPrismaService.$queryRawUnsafe.mockRejectedValue(
        new Error('SQL Syntax Error'),
      );

      const mockConversationsFallback = [
        {
          id: 'conv2',
          leadId: 'l2',
          channel: 'SMS',
          lead: { name: 'Fallback Lead' },
        },
      ];
      mockPrismaService.conversation.findMany.mockResolvedValue(
        mockConversationsFallback,
      );

      const result = await service.searchAll('business-123', 'fallback-term');

      expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId: 'business-123',
          }),
        }),
      );

      expect(result.conversations).toEqual([
        {
          id: 'conv2',
          leadId: 'l2',
          channel: 'SMS',
          leadName: 'Fallback Lead',
        },
      ]);
    });
  });
});

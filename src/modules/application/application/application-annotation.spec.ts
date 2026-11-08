import { AddApplicationNoteHandler } from '@/modules/application/application/commands/add-application-note.command';
import { DeleteApplicationNoteHandler } from '@/modules/application/application/commands/delete-application-note.command';
import { SetApplicationStarredHandler } from '@/modules/application/application/commands/set-application-starred.command';
import { ListApplicationNotesHandler } from '@/modules/application/application/queries/list-application-notes.query';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import {
  APPLICATION_NOTE_MAX_LENGTH,
  ApplicationNoteRecord,
} from '@/modules/application/domain/repositories/application-annotation.repository';
import {
  ApplicationNoteInvalidException,
  ApplicationNoteNotFoundException,
  JobApplicationNotFoundException,
  ReferencedJobNotFoundException,
} from '@/modules/application/domain/exceptions/application.exceptions';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

const RECRUITER = 'recruiter-1';
const CANDIDATE = 'candidate-1';

const note = (
  overrides: Partial<ApplicationNoteRecord> = {},
): ApplicationNoteRecord => ({
  id: 'note-1',
  applicationId: 'app-1',
  authorId: RECRUITER,
  content: 'Strong NestJS background',
  createdAt: new Date('2026-06-10T09:00:00.000Z'),
  ...overrides,
});

function setup() {
  const applicationRepository = {
    findById: jest.fn().mockResolvedValue(
      new JobApplication({
        id: 'app-1',
        userId: CANDIDATE,
        jobId: 'job-1',
        cvId: 'cv-1',
      }),
    ),
  };
  const jobLookupPort = {
    findById: jest.fn().mockResolvedValue({
      id: 'job-1',
      title: 'Backend',
      postedById: RECRUITER,
    }),
  };
  const annotationRepository = {
    findNotes: jest.fn().mockResolvedValue([]),
    findNote: jest.fn().mockResolvedValue(note()),
    createNote: jest.fn().mockImplementation((input) =>
      Promise.resolve(
        note({
          ...input,
          id: 'note-new',
          createdAt: new Date('2026-06-11T00:00:00.000Z'),
        }),
      ),
    ),
    deleteNote: jest.fn().mockResolvedValue(undefined),
    setStarred: jest.fn().mockResolvedValue(undefined),
    findStarredApplicationIds: jest.fn(),
  };
  const deps = [
    applicationRepository,
    annotationRepository,
    jobLookupPort,
  ] as const;
  return {
    applicationRepository,
    jobLookupPort,
    annotationRepository,
    list: new ListApplicationNotesHandler(
      ...(deps as unknown as [any, any, any]),
    ),
    add: new AddApplicationNoteHandler(...(deps as unknown as [any, any, any])),
    remove: new DeleteApplicationNoteHandler(
      ...(deps as unknown as [any, any, any]),
    ),
    star: new SetApplicationStarredHandler(
      ...(deps as unknown as [any, any, any]),
    ),
  };
}

type Ctx = ReturnType<typeof setup>;

// Every operation goes through the same gate: only the job's poster, never the
// candidate, never another recruiter. Each case below runs against all four.
const operations: [
  string,
  (ctx: Ctx, requester: string) => Promise<unknown>,
][] = [
  [
    'list notes',
    (ctx, r) =>
      ctx.list.execute({ recruiterId: r, applicationId: 'app-1' } as any),
  ],
  [
    'add a note',
    (ctx, r) =>
      ctx.add.execute({
        recruiterId: r,
        applicationId: 'app-1',
        content: 'x',
      } as any),
  ],
  [
    'delete a note',
    (ctx, r) =>
      ctx.remove.execute({
        recruiterId: r,
        applicationId: 'app-1',
        noteId: 'note-1',
      } as any),
  ],
  [
    'star',
    (ctx, r) =>
      ctx.star.execute({
        recruiterId: r,
        applicationId: 'app-1',
        starred: true,
      } as any),
  ],
];

describe('recruiter notes and star — access', () => {
  describe.each(operations)('%s', (_name, run) => {
    it("refuses the candidate who submitted the application (it's recruiter-private)", async () => {
      const ctx = setup();
      await expect(run(ctx, CANDIDATE)).rejects.toThrow(
        UnauthorizedDomainException,
      );
      expect(ctx.annotationRepository.findNotes).not.toHaveBeenCalled();
      expect(ctx.annotationRepository.createNote).not.toHaveBeenCalled();
      expect(ctx.annotationRepository.deleteNote).not.toHaveBeenCalled();
      expect(ctx.annotationRepository.setStarred).not.toHaveBeenCalled();
    });

    it("refuses a recruiter who doesn't own the job", async () => {
      const ctx = setup();
      await expect(run(ctx, 'recruiter-2')).rejects.toThrow(
        UnauthorizedDomainException,
      );
    });

    it('reports an unknown application as not found', async () => {
      const ctx = setup();
      ctx.applicationRepository.findById.mockResolvedValue(null);
      await expect(run(ctx, RECRUITER)).rejects.toThrow(
        JobApplicationNotFoundException,
      );
    });

    it("reports a missing job as not found (and doesn't treat it as owned)", async () => {
      const ctx = setup();
      ctx.jobLookupPort.findById.mockResolvedValue(null);
      await expect(run(ctx, RECRUITER)).rejects.toThrow(
        ReferencedJobNotFoundException,
      );
    });
  });
});

describe('ListApplicationNotesHandler', () => {
  it("returns the application's notes as the repository orders them (newest first)", async () => {
    const ctx = setup();
    ctx.annotationRepository.findNotes.mockResolvedValue([
      note({
        id: 'n2',
        content: 'Round 2',
        createdAt: new Date('2026-06-12T00:00:00.000Z'),
      }),
      note({ id: 'n1', content: 'Round 1' }),
    ]);

    const result = await ctx.list.execute({
      recruiterId: RECRUITER,
      applicationId: 'app-1',
    } as any);

    expect(ctx.annotationRepository.findNotes).toHaveBeenCalledWith('app-1');
    expect(result.map((n) => [n.id, n.content])).toEqual([
      ['n2', 'Round 2'],
      ['n1', 'Round 1'],
    ]);
    expect(result[0]).toEqual({
      id: 'n2',
      content: 'Round 2',
      authorId: RECRUITER,
      createdAt: new Date('2026-06-12T00:00:00.000Z'),
    });
  });
});

describe('AddApplicationNoteHandler', () => {
  it('stores the trimmed note, attributed to the recruiter', async () => {
    const ctx = setup();

    const result = await ctx.add.execute({
      recruiterId: RECRUITER,
      applicationId: 'app-1',
      content: '   Strong system design   ',
    } as any);

    expect(ctx.annotationRepository.createNote).toHaveBeenCalledWith({
      applicationId: 'app-1',
      authorId: RECRUITER,
      content: 'Strong system design',
    });
    expect(result).toMatchObject({
      id: 'note-new',
      content: 'Strong system design',
      authorId: RECRUITER,
    });
  });

  it.each(['', '   ', '\n\t '])(
    'refuses an empty or whitespace-only note (%p)',
    async (content) => {
      const ctx = setup();
      await expect(
        ctx.add.execute({
          recruiterId: RECRUITER,
          applicationId: 'app-1',
          content,
        } as any),
      ).rejects.toThrow(ApplicationNoteInvalidException);
      expect(ctx.annotationRepository.createNote).not.toHaveBeenCalled();
    },
  );

  it(`accepts exactly ${APPLICATION_NOTE_MAX_LENGTH} characters and refuses one more`, async () => {
    const ctx = setup();
    await expect(
      ctx.add.execute({
        recruiterId: RECRUITER,
        applicationId: 'app-1',
        content: 'a'.repeat(APPLICATION_NOTE_MAX_LENGTH),
      } as any),
    ).resolves.toBeDefined();

    await expect(
      ctx.add.execute({
        recruiterId: RECRUITER,
        applicationId: 'app-1',
        content: 'a'.repeat(APPLICATION_NOTE_MAX_LENGTH + 1),
      } as any),
    ).rejects.toThrow(ApplicationNoteInvalidException);
  });

  it('measures the limit after trimming, so surrounding whitespace never pushes a note over', async () => {
    const ctx = setup();
    await expect(
      ctx.add.execute({
        recruiterId: RECRUITER,
        applicationId: 'app-1',
        content: `  ${'a'.repeat(APPLICATION_NOTE_MAX_LENGTH)}  `,
      } as any),
    ).resolves.toBeDefined();
  });
});

describe('DeleteApplicationNoteHandler', () => {
  it('deletes a note on the application', async () => {
    const ctx = setup();

    await ctx.remove.execute({
      recruiterId: RECRUITER,
      applicationId: 'app-1',
      noteId: 'note-1',
    } as any);

    expect(ctx.annotationRepository.deleteNote).toHaveBeenCalledWith('note-1');
  });

  it('refuses a note that belongs to a different application, even one you own — reported as not found', async () => {
    const ctx = setup();
    ctx.annotationRepository.findNote.mockResolvedValue(
      note({ applicationId: 'app-other' }),
    );

    await expect(
      ctx.remove.execute({
        recruiterId: RECRUITER,
        applicationId: 'app-1',
        noteId: 'note-1',
      } as any),
    ).rejects.toThrow(ApplicationNoteNotFoundException);
    expect(ctx.annotationRepository.deleteNote).not.toHaveBeenCalled();
  });

  it('reports a note that does not exist as not found', async () => {
    const ctx = setup();
    ctx.annotationRepository.findNote.mockResolvedValue(null);

    await expect(
      ctx.remove.execute({
        recruiterId: RECRUITER,
        applicationId: 'app-1',
        noteId: 'nope',
      } as any),
    ).rejects.toThrow(ApplicationNoteNotFoundException);
  });

  it('can delete a note whose author account was deleted (authorId is null)', async () => {
    const ctx = setup();
    ctx.annotationRepository.findNote.mockResolvedValue(
      note({ authorId: null }),
    );

    await ctx.remove.execute({
      recruiterId: RECRUITER,
      applicationId: 'app-1',
      noteId: 'note-1',
    } as any);

    expect(ctx.annotationRepository.deleteNote).toHaveBeenCalledWith('note-1');
  });
});

describe('SetApplicationStarredHandler', () => {
  it('stars with the current time', async () => {
    const ctx = setup();

    const result = await ctx.star.execute({
      recruiterId: RECRUITER,
      applicationId: 'app-1',
      starred: true,
    } as any);

    expect(ctx.annotationRepository.setStarred).toHaveBeenCalledWith(
      'app-1',
      expect.any(Date),
    );
    expect(result).toEqual({ isStarred: true });
  });

  it('unstars by clearing the time', async () => {
    const ctx = setup();

    const result = await ctx.star.execute({
      recruiterId: RECRUITER,
      applicationId: 'app-1',
      starred: false,
    } as any);

    expect(ctx.annotationRepository.setStarred).toHaveBeenCalledWith(
      'app-1',
      null,
    );
    expect(result).toEqual({ isStarred: false });
  });

  it('never touches the application itself (so it cannot overwrite a concurrent status change)', async () => {
    const ctx = setup();
    const applicationRepository =
      ctx.applicationRepository as unknown as Record<
        string,
        jest.Mock | undefined
      >;

    await ctx.star.execute({
      recruiterId: RECRUITER,
      applicationId: 'app-1',
      starred: true,
    } as any);

    // Only a read of the application; no write method was even provided to the handler.
    expect(Object.keys(applicationRepository)).toEqual(['findById']);
  });
});

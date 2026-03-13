using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;

namespace OrderManagement.Infrastructure.Persistence;

public class GenericRepository<TEntity> : IGenericRepository<TEntity> where TEntity : class
{
    private readonly ApplicationDbContext _context;
    public DbSet<TEntity> DbSet { get; }

    public GenericRepository(ApplicationDbContext context)
    {
        _context = context;
        DbSet = _context.Set<TEntity>();
    }

    public async Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await DbSet.FindAsync(new object[] { id }, cancellationToken);

    public async Task<IReadOnlyList<TEntity>> ListAsync(
        Expression<Func<TEntity, bool>>? predicate = null,
        Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>>? orderBy = null,
        string? includeString = null,
        bool disableTracking = true,
        CancellationToken cancellationToken = default)
    {
        IQueryable<TEntity> query = DbSet;
        if (disableTracking)
            query = query.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(includeString))
            query = query.Include(includeString);
        if (predicate != null)
            query = query.Where(predicate);
        if (orderBy != null)
            query = orderBy(query);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<TEntity> AddAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        await DbSet.AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task UpdateAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        DbSet.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        DbSet.Remove(entity);
        return Task.CompletedTask;
    }
}

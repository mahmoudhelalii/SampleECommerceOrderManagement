using System.Collections.Concurrent;
using OrderManagement.Application.Common.Interfaces;

namespace OrderManagement.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly ConcurrentDictionary<string, object> _repositories = new();

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IGenericRepository<TEntity> Repository<TEntity>() where TEntity : class
    {
        var typeName = typeof(TEntity).Name;
        if (_repositories.TryGetValue(typeName, out var repo))
            return (IGenericRepository<TEntity>)repo;

        var repositoryInstance = new GenericRepository<TEntity>(_context);
        _repositories[typeName] = repositoryInstance;
        return repositoryInstance;
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);

    public async ValueTask DisposeAsync()
    {
        await _context.DisposeAsync();
    }
}

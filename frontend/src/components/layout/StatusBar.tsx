interface Props { loading?: boolean }

export const StatusBar = ({ loading = false }: Props) => (
  <div className="shrink-0 relative overflow-hidden" style={{ height: '2px' }}>
    {loading ? (
      <>
        <div className="absolute inset-0 bg-blue-200" />
        <div
          className="absolute inset-y-0 w-2/5 status-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #3b82f6 40%, #93c5fd 60%, transparent 100%)' }}
        />
      </>
    ) : (
      <div className="absolute inset-0 bg-lime-400" />
    )}
  </div>
)

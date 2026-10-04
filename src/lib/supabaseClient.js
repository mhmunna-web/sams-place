// Temporary compatibility layer.
// Firebase is now used for authentication.
// Existing public/admin components still reference this file.

const createQuery = () => {
  const result = Promise.resolve({
    data: [],
    error: new Error("Supabase backend is no longer used."),
  });

  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: () => result,
    single: () => result,
    insert: () => result,
    update: () => query,
    delete: () => query,
  };

  query.then = result.then.bind(result);
  query.catch = result.catch.bind(result);
  query.finally = result.finally.bind(result);

  return query;
};

export const supabase = {
  from: () => createQuery(),

  auth: {
    getUser: async () => ({
      data: { user: null },
      error: null,
    }),

    getSession: async () => ({
      data: { session: null },
      error: null,
    }),

    signOut: async () => ({
      error: null,
    }),
  },

  storage: {
    from: () => ({
      upload: async () => ({
        data: null,
        error: new Error("Storage is now handled by Firebase."),
      }),

      remove: async () => ({
        data: null,
        error: null,
      }),

      getPublicUrl: () => ({
        data: { publicUrl: "" },
      }),
    }),
  },
};

export default supabase;
import pinecone
pinecone.init(api_key="pinecone-api-key", environment="us-west1-gcp")

index_name = "music-recommendation"
if index_name not in pinecone.list_indexes():
    pinecone.create_index(index_name, dimension=512)
index = pinecone.Index(index_name)

def upsert_embeddings(embeddings, ids):
    vectors = [(str(id), embedding) for id, embedding in zip(ids, embeddings)]
    index.upsert(vectors)

def query_embeddings(embedding, top_k=10):
    result = index.query(embedding, top_k=top_k)
    return result
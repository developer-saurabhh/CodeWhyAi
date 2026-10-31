"""
CodeWhy AI — Neo4j Graph Database Driver (Python)
HackFront India 2026

Manages schema constraints, Cypher batch ingestion, and multi-hop evidence path traversal.
Compatible with Neo4j AuraDB (cloud) and local Neo4j Desktop / Docker instances.
"""

import os
from typing import Dict, Any, List, Optional
try:
    from neo4j import GraphDatabase, Driver
except ImportError:
    GraphDatabase = None
    Driver = None

class Neo4jGraphService:
    def __init__(self, uri: Optional[str] = None, user: Optional[str] = None, password: Optional[str] = None):
        self.uri = uri or os.environ.get("NEO4J_URI", "bolt://localhost:7687")
        self.user = user or os.environ.get("NEO4J_USERNAME", "neo4j")
        self.password = password or os.environ.get("NEO4J_PASSWORD", "password")
        self.driver: Optional[Driver] = None

    def connect(self) -> bool:
        if not GraphDatabase:
            print("neo4j library not installed. Install via pip install neo4j")
            return False
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            self.driver.verify_connectivity()
            print(f"Connected to Neo4j instance at {self.uri}")
            return True
        except Exception as e:
            print(f"Failed to connect to Neo4j: {e}")
            self.driver = None
            return False

    def init_schema_constraints(self):
        """
        Creates uniqueness constraints for optimal graph indexing and deduplication.
        """
        constraints = [
            "CREATE CONSTRAINT unique_repo_fullname IF NOT EXISTS FOR (r:Repository) REQUIRE r.fullName IS UNIQUE",
            "CREATE CONSTRAINT unique_commit_hash IF NOT EXISTS FOR (c:Commit) REQUIRE c.hash IS UNIQUE",
            "CREATE CONSTRAINT unique_file_path IF NOT EXISTS FOR (f:File) REQUIRE f.id IS UNIQUE",
            "CREATE CONSTRAINT unique_pr_id IF NOT EXISTS FOR (pr:PullRequest) REQUIRE pr.id IS UNIQUE",
            "CREATE CONSTRAINT unique_issue_id IF NOT EXISTS FOR (i:Issue) REQUIRE i.id IS UNIQUE",
            "CREATE CONSTRAINT unique_dev_name IF NOT EXISTS FOR (d:Developer) REQUIRE d.name IS UNIQUE",
        ]

        if not self.driver:
            return

        with self.driver.session() as session:
            for query in constraints:
                session.run(query)
            print("Neo4j schema constraints successfully applied.")

    def ingest_batch(self, batch_payload: Dict[str, Any]):
        """
        Batches nodes and relationships using Cypher UNWIND for high throughput.
        """
        if not self.driver:
            return

        nodes = batch_payload.get("nodes", [])
        relationships = batch_payload.get("relationships", [])

        node_cypher = """
        UNWIND $nodes AS node
        CALL apoc.create.node(node.labels, node.properties) YIELD node AS createdNode
        RETURN count(createdNode)
        """

        rel_cypher = """
        UNWIND $relationships AS rel
        MATCH (source {id: rel.from})
        MATCH (target {id: rel.to})
        CALL apoc.create.relationship(source, rel.type, {}, target) YIELD rel AS createdRel
        RETURN count(createdRel)
        """

        with self.driver.session() as session:
            session.run(node_cypher, nodes=nodes)
            session.run(rel_cypher, relationships=relationships)
            print(f"Ingested {len(nodes)} nodes and {len(relationships)} relationships into Neo4j.")

    def query_evidence_path(self, keyword: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Multi-hop traversal query locating historical bug reports and pull requests behind a change.
        """
        if not self.driver:
            return []

        cypher = """
        MATCH (c:Commit)
        WHERE toLower(c.message) CONTAINS toLower($keyword)
        OPTIONAL MATCH (dev:Developer)-[:DEVELOPER_AUTHORED_COMMIT]->(c)
        OPTIONAL MATCH (c)-[:COMMIT_MODIFIES_FILE]->(f:File)
        OPTIONAL MATCH (pr:PullRequest)-[:PULL_REQUEST_CONTAINS_COMMIT]->(c)
        OPTIONAL MATCH (issue:Issue)-[:ISSUE_LINKED_TO_PULL_REQUEST]->(pr)
        RETURN 
            c.shortHash AS commitHash,
            c.message AS commitMessage,
            dev.name AS author,
            c.date AS commitDate,
            collect(DISTINCT f.path) AS files,
            pr.id AS prNumber,
            pr.title AS prTitle,
            issue.id AS issueNumber,
            issue.title AS issueTitle
        LIMIT $limit
        """

        with self.driver.session() as session:
            result = session.run(cypher, keyword=keyword, limit=limit)
            return [record.data() for record in result]

    def close(self):
        if self.driver:
            self.driver.close()

"""
Semantic video tagging using sentence transformers.

Uses text embeddings to understand video content contextually and assign tags
based on semantic similarity rather than keyword matching.
"""

from sentence_transformers import SentenceTransformer, util
import json
from typing import List, Dict


class SemanticTagger:
    """
    Semantic tagging using sentence transformer embeddings.

    Uses cosine similarity between video content and tag descriptions
    to determine relevance with confidence scores.
    """

    def __init__(self, tag_descriptions_path: str = 'tag_descriptions.json',
                 model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize semantic tagger.

        Args:
            tag_descriptions_path: Path to tag descriptions JSON
            model_name: Sentence transformer model to use
                       Options (from fastest to most accurate):
                       - 'all-MiniLM-L6-v2' (default): 80MB, fast, good quality
                       - 'all-mpnet-base-v2': 420MB, slower, better quality
                       - 'paraphrase-MiniLM-L6-v2': 80MB, optimized for paraphrasing
                       - 'all-distilroberta-v1': 290MB, good balance
        """
        # Load tag descriptions
        with open(tag_descriptions_path, 'r') as f:
            self.tag_descriptions = json.load(f)

        # Load sentence transformer model (downloads on first run)
        print(f"🤖 Loading semantic model: {model_name}...")
        self.model = SentenceTransformer(model_name)

        # Pre-compute tag embeddings (only once)
        print(f"📊 Computing embeddings for {len(self.tag_descriptions)} tags...")
        self.tags = list(self.tag_descriptions.keys())
        self.tag_embeddings = self.model.encode(
            list(self.tag_descriptions.values()),
            convert_to_tensor=True,
            show_progress_bar=False
        )

    def tag_video(self, title: str, description: str,
                  threshold: float = 0.65) -> Dict[str, float]:
        """
        Tag a single video using semantic similarity.

        Args:
            title: Video title (weighted 2x)
            description: Video description (cleaned)
            threshold: Minimum similarity score to apply tag (0.0-1.0)

        Returns:
            Dict mapping tag names to confidence scores (only above threshold)
        """
        # Combine title (2x weight) and description
        # Title matters more because it's the main focus
        text = f"{title} {title} {description}"

        # Compute embedding for this video
        video_embedding = self.model.encode(text, convert_to_tensor=True)

        # Calculate cosine similarity with all tag descriptions
        similarities = util.cos_sim(video_embedding, self.tag_embeddings)[0]

        # Return tags above threshold with their scores
        results = {}
        for tag, score in zip(self.tags, similarities.cpu().numpy()):
            if score >= threshold:
                results[tag] = float(score)

        return results

    def tag_videos_batch(self, videos: List[Dict], threshold: float = 0.65,
                         cleaned_descriptions: bool = True) -> List[Dict]:
        """
        Tag multiple videos efficiently.

        Args:
            videos: List of video dicts with 'title' and 'description'
            threshold: Minimum similarity score
            cleaned_descriptions: Whether to clean paint lists first

        Returns:
            Videos with 'tags' (list) and 'tag_scores' (dict) added
        """
        # Import here to avoid circular dependency
        try:
            from update_videos import clean_description_for_tagging
        except ImportError:
            # Fallback if running standalone
            def clean_description_for_tagging(desc):
                return desc
            cleaned_descriptions = False

        results = []
        for i, video in enumerate(videos):
            title = video.get('title', '')
            description = video.get('description', '')

            # Clean description to remove paint lists
            if cleaned_descriptions:
                description = clean_description_for_tagging(description)

            # Get semantic tags with scores
            tag_scores = self.tag_video(title, description, threshold)

            # Add to video
            video_copy = video.copy()
            video_copy['tags'] = list(tag_scores.keys())
            video_copy['tag_scores'] = tag_scores
            results.append(video_copy)

            # Progress indicator
            if (i + 1) % 50 == 0:
                print(f"  Tagged {i + 1}/{len(videos)} videos...")

        return results

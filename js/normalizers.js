(function () {
  'use strict';

  window.normalizeBook = function normalizeBook(raw) {
    if (!raw) return null;
    const data = raw.volumeInfo || raw;
    const imageLinks = data.imageLinks || {};
    const thumbnail = imageLinks.thumbnail || imageLinks.smallThumbnail || data.image || "";
    const secureThumb = String(thumbnail).replace(/^http:/i, "https:");
    const authors = data.authors || (data.author ? [data.author] : []);
    const authorStr = Array.isArray(authors) ? authors.filter(Boolean).join(", ") : String(authors || "");
    const publishedDate = data.publishedDate || data.releaseDate || "";
    const year = publishedDate ? parseInt(publishedDate.substring(0, 4)) : null;
    const categories = data.categories || data.genres || data.subject || [];
    const catArr = Array.isArray(categories) ? categories : (typeof categories === "string" ? [categories] : []);

    return {
      id: raw.id || data.id || "",
      mediaType: "book",
      title: String(data.title || "").trim(),
      subtitle: String(data.subtitle || "").trim(),
      authors: authorStr,
      author: authorStr,
      artist: authorStr,
      year: year ? String(year) : "",
      description: String(data.description || "").trim().replace(/<[^>]+>/g, ""),
      genres: catArr,
      categories: catArr,
      image: secureThumb || "/images/fallback/book.svg",
      backdrop: secureThumb || "",
      rating: Number(data.averageRating || data.rating || 0),
      ratingsCount: Number(data.ratingsCount || data.ratingsCount || 0),
      popularity: Number(data.popularity || 0),
      language: String(data.language || "").trim(),
      pageCount: Number(data.pageCount || data.number_of_pages || data.page_count || 0),
      publisher: String(data.publisher || "").trim(),
      albumType: "",
      trackCount: 0,
      previewUrl: String(data.previewLink || "").trim(),
      externalUrl: String(data.infoLink || data.externalUrl || "").trim(),
      releaseDate: publishedDate,
      coverColor: "",
      provider: "google-books",
      providerId: raw.id || data.id || ""
    };
  };

  window.normalizeAlbum = function normalizeAlbum(raw) {
    if (!raw) return null;
    const artists = raw.artists || (raw.artist ? [raw.artist] : []);
    const artistStr = Array.isArray(artists) ? artists.filter(Boolean).join(", ") : String(artists || "");
    const image = raw.image || raw.cover || (raw.images && raw.images.length > 0 ? raw.images[0].url || raw.images[0] : "") || "";
    const genres = raw.genres || [];
    const genreArr = Array.isArray(genres) ? genres : (typeof genres === "string" ? [genres] : []);
    const durationMs = raw.durationMs || raw.duration_ms || raw.duration || 0;
    const totalTracks = raw.totalTracks || raw.total_tracks || raw.nb_tracks || 0;

    return {
      id: raw.id || "",
      mediaType: "music",
      title: String(raw.title || raw.name || raw.albumName || raw.album_name || "").trim(),
      subtitle: artistStr,
      authors: artistStr,
      artist: artistStr,
      artists: artistStr,
      year: raw.releaseDate ? String(raw.releaseDate).substring(0, 4) : "",
      description: String(raw.description || "").trim(),
      genres: genreArr,
      categories: genreArr,
      image: String(image).replace(/^http:/i, "https:") || "/images/fallback/music.svg",
      backdrop: String(image).replace(/^http:/i, "https:") || "",
      rating: Number(raw.rating || raw.popularity || 0),
      ratingsCount: 0,
      popularity: Number(raw.popularity || 0),
      language: String(raw.language || raw.language || "").trim(),
      pageCount: 0,
      publisher: String(raw.label || "").trim(),
      albumType: String(raw.albumType || raw.album_type || "album").trim(),
      trackCount: Number(totalTracks),
      previewUrl: String(raw.previewUrl || raw.preview_url || raw.preview || "").trim(),
      externalUrl: String(raw.externalUrl || raw.external_url || raw.link || "").trim(),
      releaseDate: String(raw.releaseDate || raw.release_date || raw.releaseDate || "").trim(),
      coverColor: "",
      provider: raw.provider || raw.source || "spotify",
      providerId: raw.id || ""
    };
  };

  window.normalizeTrack = function normalizeTrack(raw) {
    if (!raw) return null;
    const artists = raw.artists || (raw.artist ? [raw.artist] : []);
    const artistStr = Array.isArray(artists) ? artists.filter(Boolean).join(", ") : String(artists || "");
    const image = raw.image || raw.cover || (raw.images && raw.images.length > 0 ? raw.images[0].url || raw.images[0] : "") || "";
    const genres = raw.genres || [];
    const genreArr = Array.isArray(genres) ? genres : (typeof genres === "string" ? [genres] : []);

    return {
      id: raw.id || "",
      mediaType: "music",
      title: String(raw.title || raw.name || "").trim(),
      subtitle: artistStr,
      authors: artistStr,
      artist: artistStr,
      artists: artistStr,
      year: raw.releaseDate ? String(raw.releaseDate).substring(0, 4) : "",
      description: String(raw.description || "").trim(),
      genres: genreArr,
      categories: genreArr,
      image: String(image).replace(/^http:/i, "https:") || "/images/fallback/music.svg",
      backdrop: String(image).replace(/^http:/i, "https:") || "",
      rating: Number(raw.rating || raw.popularity || 0),
      ratingsCount: 0,
      popularity: Number(raw.popularity || 0),
      language: String(raw.language || "").trim(),
      pageCount: 0,
      publisher: String(raw.label || "").trim(),
      albumType: String(raw.albumType || raw.album_type || "track").trim(),
      trackCount: 0,
      previewUrl: String(raw.previewUrl || raw.preview_url || raw.preview || "").trim(),
      externalUrl: String(raw.externalUrl || raw.external_url || raw.link || "").trim(),
      releaseDate: String(raw.releaseDate || raw.release_date || "").trim(),
      coverColor: "",
      provider: raw.provider || raw.source || "spotify",
      providerId: raw.id || "",
      durationMs: Number(raw.durationMs || raw.duration_ms || raw.duration || 0),
      explicit: !!raw.explicit,
      albumName: String(raw.albumName || raw.album_name || raw.album?.name || "").trim(),
      albumId: String(raw.albumId || raw.album_id || raw.album?.id || "").trim(),
      trackNumber: Number(raw.trackNumber || raw.track_number || 0),
      discNumber: Number(raw.discNumber || raw.disc_number || 0)
    };
  };

})();

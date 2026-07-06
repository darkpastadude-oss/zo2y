(function () {
  'use strict';

  var Content = window.Zo2yContent;
  var ContentProvider = window.Zo2yContentProvider.ContentProvider;

  function SportsProvider() {
    ContentProvider.call(this, {
      name: 'sportsdb',
      mediaType: Content.CONTENT_TYPES.SPORTS,
      apiBase: '/api/sportsdb',
      cacheTTL: 15 * 60 * 1000
    });
  }

  SportsProvider.prototype = Object.create(ContentProvider.prototype);
  SportsProvider.prototype.constructor = SportsProvider;

  SportsProvider.prototype.search = function (query, options) {
    var self = this;
    var url = this.apiBase + '/searchteams.php?t=' + encodeURIComponent(query);

    return this._fetchJson(url, { cacheKey: 'sports:search:' + query })
      .then(function (data) {
        var items = data.teams || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: items.length
        };
      });
  };

  SportsProvider.prototype.getById = function (id, options) {
    var self = this;
    var url = this.apiBase + '/lookupteam.php?id=' + encodeURIComponent(id);

    return this._fetchJson(url, { cacheKey: 'sports:team:' + id })
      .then(function (data) {
        var teams = data.teams || [];
        return teams.length > 0 ? self.mapToContent(teams[0]) : null;
      });
  };

  SportsProvider.prototype.getTrending = function (options) {
    return this.getPopular(options);
  };

  SportsProvider.prototype.getPopular = function (options) {
    var self = this;
    var opts = options || {};
    var league = opts.league || '4328';
    var url = this.apiBase + '/lookup_all_teams.php?id=' + encodeURIComponent(league);

    return this._fetchJson(url, { cacheKey: 'sports:league:' + league })
      .then(function (data) {
        var items = data.teams || [];
        return {
          items: items.map(function (item) { return self.mapToContent(item); }).filter(Boolean),
          total: items.length
        };
      });
  };

  SportsProvider.prototype.mapToContent = function (raw) {
    if (!raw) return null;

    var title = raw.strTeam || '';
    if (!title) return null;

    return Content.normalizeContent({
      id: String(raw.idTeam || ''),
      title: title,
      subtitle: raw.strLeague || '',
      creators: raw.strManager || '',
      description: raw.strDescriptionEN || '',
      image: raw.strBadge || raw.strLogo || raw.strFanArt1 || '',
      backdrop: raw.strFanArt1 || raw.strBanner || '',
      genres: [raw.strSport || '', raw.strLeague || ''].filter(Boolean),
      language: raw.strCountry || '',
      externalUrl: raw.strWebsite || '',
      provider: 'thesportsdb',
      providerId: String(raw.idTeam || ''),
      metadata: {
        sport: raw.strSport || '',
        league: raw.strLeague || '',
        leagueId: raw.idLeague || '',
        stadium: raw.strStadium || '',
        stadiumCapacity: raw.intStadiumCapacity || '',
        location: raw.strLocation || '',
        country: raw.strCountry || '',
        gender: raw.strGender || '',
        formationYear: raw.intFormedYear || '',
        teamShort: raw.strTeamShort || '',
        alternateNames: [raw.strTeamAlternate, raw.strTeamNameShort].filter(Boolean)
      }
    }, Content.CONTENT_TYPES.SPORTS);
  };

  SportsProvider.prototype.mapSearchResult = function (raw) {
    var content = this.mapToContent(raw);
    if (!content) return null;
    return Content.createSearchResult(content, Content.CONTENT_TYPES.SPORTS);
  };

  window.Zo2ySportsProvider = new SportsProvider();
})();

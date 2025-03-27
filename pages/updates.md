---
layout: default
title: Updates
permalink: /updates/
---

<div class="home-columns">
  <div class="column-left">
<div class="home">
<h2>Updates</h2>
  <ul>
    {% for post in site.posts limit:5 %}      <li>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <span>{{ post.date | date: "%B %d, %Y" }}</span>
      </li>
    {% endfor %}
    <p class="rss-subscribe">subscribe <a href="{{ "/feed.xml" | relative_url }}">via RSS</a></p>
  </ul>

<!-- Pagination Controls -->
<div class="pagination">
  {% if paginator.previous_page %}
    <a href="{{ paginator.previous_page_path | relative_url }}">← Previous</a>
  {% endif %}
  
  {% if paginator.next_page %}
    <a href="{{ paginator.next_page_path | relative_url }}">Next →</a>
  {% endif %}
</div>
</div>
</div>

 <div class="column-right">
<h2>Categories</h2>
<ul>
  {% for category in site.categories %}
    <li>
      <a href="{{ site.baseurl }}/categories/{{ category[0] | slugify }}/">
        {{ category[0] }} ({{ category[1].size }})
      </a>
    </li>
  {% endfor %}
</ul>
  </div>
</div>
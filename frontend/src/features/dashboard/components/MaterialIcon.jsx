import React from 'react';

// 아이콘 이름 매핑 (Material Icons에서 실제 사용 가능한 이름으로 변환)
const iconMapping = {
  'school': 'school',
  'star_outline': 'star_outline',
  'timer': 'timer',
  'quiz': 'quiz',
  'add_circle_outline': 'add_circle_outline',
  'bookmarks': 'bookmark',
  'lightbulb': 'lightbulb',
  'play_arrow': 'play_arrow',
  'check_circle': 'check_circle',
  'schedule': 'schedule',
  'trending_up': 'trending_up',
  'assessment': 'assessment',
  'history': 'history',
  'favorite': 'favorite',
  'favorite_border': 'favorite_border',
  'star': 'star',
  'star_border': 'star_border',
  'grade': 'grade',
  'thumb_up': 'thumb_up',
  'thumb_down': 'thumb_down',
  'help': 'help',
  'info': 'info',
  'warning': 'warning',
  'error': 'error',
  'success': 'check_circle',
  'close': 'close',
  'menu': 'menu',
  'search': 'search',
  'filter_list': 'filter_list',
  'sort': 'sort',
  'refresh': 'refresh',
  'download': 'download',
  'upload': 'upload',
  'print': 'print',
  'share': 'share',
  'edit': 'edit',
  'delete': 'delete',
  'add': 'add',
  'remove': 'remove',
  'visibility': 'visibility',
  'visibility_off': 'visibility_off',
  'settings': 'settings',
  'account_circle': 'account_circle',
  'notifications': 'notifications',
  'email': 'email',
  'phone': 'phone',
  'location_on': 'location_on',
  'calendar_today': 'calendar_today',
  'access_time': 'access_time',
  'today': 'today',
  'event': 'event',
  'folder': 'folder',
  'description': 'description',
  'article': 'article',
  'note': 'note',
  'assignment': 'assignment',
  'homework': 'homework',
  'book': 'book',
  'library_books': 'library_books',
  'local_library': 'local_library',
  'school_outlined': 'school',
  'star_outline_outlined': 'star_outline',
  'timer_outlined': 'timer',
  'replay': 'replay',
};

export const MaterialIcon = ({ iconName, className = "text-primary" }) => {
  // 매핑된 아이콘 이름을 사용하거나, 없으면 원본 이름 사용
  const mappedIconName = iconMapping[iconName] || iconName;
  
  return (
    <span className={`material-icons-outlined ${className}`} title={iconName}>
      {mappedIconName}
    </span>
  );
};
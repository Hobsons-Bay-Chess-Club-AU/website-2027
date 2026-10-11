import {calendarCategories,eventsInMonth} from './calendar.mjs';

export function readCalendarState(search,{month,view='month',minimum,maximum}={}){
 const params=new URLSearchParams(search);
 const category=params.get('category');
 const requestedMonth=params.get('month');
 const validMonth=/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth||'')&&(!minimum||requestedMonth>=minimum)&&(!maximum||requestedMonth<=maximum);
 return {
  month:validMonth?requestedMonth:month,
  category:Object.hasOwn(calendarCategories,category)?category:'all',
  view:['month','agenda','upcoming'].includes(params.get('view'))?params.get('view'):view,
 };
}
export function writeCalendarState(currentUrl,state){
 const url=new URL(currentUrl);
 for(const key of ['category','view','month']){
  if((key==='category'&&state[key]==='all')||(key==='view'&&state[key]==='month'))url.searchParams.delete(key);
  else url.searchParams.set(key,state[key]);
 }
 return url.pathname+url.search+url.hash;
}
export function visibleCalendarEvents(events,state,today){
 return state.view==='upcoming'
  ? events.filter(e=>e.endDate>=today&&(state.category==='all'||e.category===state.category))
  : eventsInMonth(events,state.month,state.category);
}

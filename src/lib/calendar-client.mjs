import {calendarCategories,calendarMonth,eventsInMonth,addDays} from './calendar.mjs';
import {readCalendarState,writeCalendarState,visibleCalendarEvents} from './calendar-state.mjs';
import {siteUrl} from './site-url.mjs';
const dayLabel=value=>new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
function element(tag,className,text){
 const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;
}
export function setupCalendars(){
 for(const root of document.querySelectorAll('[data-club-calendar]')){
  if(root.dataset.ready)continue;root.dataset.ready='true';
  const review=root.dataset.calendarReview==='true';
  const {events}=JSON.parse(root.querySelector('[data-calendar-data]').textContent);
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Melbourne'}),minimum=events[0]?.startDate.slice(0,7),maximum=events.reduce((last,e)=>e.endDate>last?e.endDate:last,'').slice(0,7);
  let month=calendarMonth(events,today);
  const filter=root.querySelector('[data-calendar-filter]'),view=root.querySelector('[data-calendar-view]'),grid=root.querySelector('[data-calendar-grid]'),agenda=root.querySelector('[data-calendar-agenda]');
  if(window.matchMedia('(max-width:700px)').matches)view.value='agenda';
  const defaults={month,view:view.value,minimum,maximum};
  const restore=()=>{const state=readCalendarState(window.location.search,defaults);month=state.month;filter.value=state.category;view.value=state.view;};
  if(review)restore();
  const render=()=>{
   const upcoming=review&&view.value==='upcoming';
   const visible=review?visibleCalendarEvents(events,{month,category:filter.value,view:view.value},today):eventsInMonth(events,month,filter.value),first=month+'-01',date=new Date(first+'T00:00:00Z');
   const next=new Date(date);next.setUTCMonth(next.getUTCMonth()+1);
   const last=addDays(next.toISOString().slice(0,10),-1),offset=(date.getUTCDay()+6)%7;
   root.querySelector('[data-calendar-heading]').textContent=upcoming?'Upcoming events':new Intl.DateTimeFormat('en-AU',{month:'long',year:'numeric',timeZone:'UTC'}).format(date);
   root.querySelector('[data-calendar-previous]').disabled=upcoming||Boolean(minimum&&month<=minimum);
   root.querySelector('[data-calendar-next]').disabled=upcoming||Boolean(maximum&&month>=maximum);
   root.querySelector('[data-calendar-today]').disabled=Boolean(minimum&&(today.slice(0,7)<minimum||today.slice(0,7)>maximum));
   root.querySelector('[data-calendar-month]').hidden=view.value!=='month';
   root.querySelector('[data-calendar-count]').textContent=visible.length+(visible.length===1?' event':' events')+(upcoming?' remaining':' this month');
   agenda.setAttribute('aria-label',upcoming?'Upcoming events':'Events this month');
   grid.replaceChildren();agenda.replaceChildren();
   for(let i=0;i<offset;i++)grid.append(element('div','calendar-cell calendar-cell-empty'));
   for(let day=first;day<=last;day=addDays(day)){
    const cell=element('div','calendar-cell'+(day===today?' calendar-cell-today':'')),label=element('time','calendar-day',String(Number(day.slice(-2))));
    label.dateTime=day;cell.append(label);
    for(const e of visible.filter(e=>e.startDate<=day&&e.endDate>=day)){
     const link=element('a','calendar-chip calendar-category-'+e.category,e.title);
     link.href='#calendar-event-'+e.id;link.title=calendarCategories[e.category]+': '+e.title;
     link.setAttribute('aria-label',dayLabel(day)+', '+calendarCategories[e.category]+': '+e.title);
     cell.append(link);
    }
    grid.append(cell);
   }
   while(grid.children.length%7)grid.append(element('div','calendar-cell calendar-cell-empty'));
   for(const event of visible){
    const item=element('article','calendar-event calendar-category-'+event.category);item.id='calendar-event-'+event.id;
    const dates=element('div','calendar-event-date'),start=element('time',null,dayLabel(event.startDate));start.dateTime=event.startDate;dates.append(start);
    if(event.endDate!==event.startDate){const end=element('time',null,dayLabel(event.endDate));end.dateTime=event.endDate;dates.append(document.createTextNode(' – '),end);}
    const content=element('div');content.append(element('span','calendar-category',calendarCategories[event.category]),element('h4',null,event.title));
    if(event.details)content.append(element('p',null,event.details));
    if(event.schoolSchedule)content.append(element('p','calendar-event-meta',event.schoolSchedule));
    if(event.arbiter)content.append(element('p','calendar-event-meta','Arbiters: '+event.arbiter));
    if(review&&event.url){const link=element('a','text-link','Event details');link.href=siteUrl(event.url);content.append(link);}
    item.append(dates,content);agenda.append(item);
   }
   if(!visible.length)agenda.append(element('p','calendar-empty',upcoming?'No upcoming dates are published for this selection. Check the event directory for future activities.':'No matching events this month.'));
  };
  const update=()=>{if(review)window.history.pushState(null,'',writeCalendarState(window.location.href,{month,category:filter.value,view:view.value}));render();};
  const move=amount=>{const value=new Date(month+'-01T00:00:00Z');value.setUTCMonth(value.getUTCMonth()+amount);month=value.toISOString().slice(0,7);update();};
  root.querySelector('[data-calendar-previous]').addEventListener('click',()=>move(-1));
  root.querySelector('[data-calendar-next]').addEventListener('click',()=>move(1));
  root.querySelector('[data-calendar-today]').addEventListener('click',()=>{month=calendarMonth(events,today);if(review&&view.value==='upcoming')view.value='month';update();});
  filter.addEventListener('change',update);view.addEventListener('change',update);
  if(review)window.addEventListener('popstate',()=>{restore();render();});
  render();
 }
}

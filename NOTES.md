## Brainstorm
Skupiny 2-4 do středy
2 - server a frontend
3 - + 3 aplikace nějaká prostě tam navař, nevim, problém budoucího delty lololo
4 - + mobilní aplikace, není zakázaná ani pro menší skupiny
kolik členů, tolik aplikací

databázi - "Rozumně velká" 8+ tabulek cca, záleží na potřebě
serverová část/backend - v C# 
Klient webový
angular
javascript 
singlepage

vymyslet databázitvořit plán / myš. mapu
jednot
vylivý klíčový části
(donutit patejdla připojit se na discord (nejtěžší na celým projektu tvl, pako to je a má špatný priority))
??

do konce týdne skupiny + myšlenku (respektive zadání), nechat si ho schválit
prezentace týmu a zadání protože já nevim bráško
start up jako v bance ??

může to bejt i něco existujícího 

pokud se nepovede zadání - zálohovač (co je to zálohovač??????)

Tahiti?
(můžeme dávat funny funkce apod?)

jsme uvařeni, nemám nápady

vyhnout se formsům
scss

budou checkpointy

mimo checkpointy bude možnost konzultace

do přístího týdne představu co dělat

brain storming
cyberpunk tinder???
discord ale ne mid (bylo by potřeba hodně featur takže pain)
e-shop - jednoduchý relativně, dá se
brain rot generátor (nechce se mi prezentovat)
hex shop
Wikipedie type shit (možná moc jednoduchý)
mapy - kurva těžký shánět data ale jsou open source, dá se 
kde je deltova renata? delta už jí našel

fiktivní mapa nebo eshop?

API pro ASP.NET Core
NuGet a context, jsme v .net
Kontroler API - *Controller.cs
Swagger (švagr) - testování - posílání http requestů
/api/[controller] - vypíše to co zachytí API v Jason
fungovat s json - univerzální komunikace mezi aplikacema, pole objektů


httpGet
httpPost - potřeba klient
httpPut - pro update

Postman pro API


Interaktivní fiktivní mapa


Git povinný
checkpoint - funkčnost, kód, "výkaz práce" (????) toggll/clockify


200 ok 


Sharing
Mobilní aplikace 
GPS tracking 
Vlastn trasy s fotkama, share ve skupině daných tras
Vlastní mapa s points of interests

fiktivní mapa i reálná

DBS - brzo na návrh databáze - dbdiagram.io
grafika - Figma

Angular - scss
http://lcalhost:4200/
může běžet neustále, s každým přepisem aktivně reaguje (poggers, to zní poggers - ŠVP)
ng generate - generuje cokoliv, advances ahh

Komponenty, no mě jebne

mc Onyx reference (oni nevidí)


## Checkpoint 1: (Pozn. by Páťa)
Mapa ma jen jednoho usera user ma vic map, musi se to nejak jinak poresit pokud chceme sdileni
soubory nedavat do databaze, je to napicu
overlay nefunguje na markery
markery seskupovat pouze graficky, jako v alzabox/zasilkovna
nedava nam to smysl

Co jsme zmenili:

Journey: cesta, sklada se z gps pointů

City a region gone
FK budou mit specifickou syntaxi, např "IdMap" misto "MapID", s tim e MapID je PK  IdMap je FK
v databazi nejsou primo obrazky, nybrz odkazy na obrazky tam jsou. Obrazky budou probably ve slozce

Struktura tabulky:
- PK
- FK(+)
- zbytek

Pro API https://codepen.io/nargesm/pen/YzVQEPm


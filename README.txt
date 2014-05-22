litterfall
==========

Application and Scripts used for the Litterfall Project

Summary of Remaining Work

Prioritization notes: Authentication and ensuring that the data is being accurately entered, stored and returned on queries is top priority.  Interface to enter/query Tree data should be prioritized over Litterfall data, as it is more useful to have for JLM’s class and needs to be finished first.

Issue numbers from Github are parenthesized.

1.	CAS authentication
  a.	See issue 92 for more details
2.	Admin Page and Views
3.	Data cleansing / ensuring all there
  a.	Make sure data there for all years
4.	General interface
  a.	Litterfall Query Interface 
    i.	Table of results out of alignment (135)
    ii.	Hide empty columns (116)
  b.	Both Query interfaces
    i.	Would be nice to standardize interface between two, especially button names (e.g. ‘search’ vs ‘view’ vs ‘query’)
    ii.	Would be nice to add a loading icon while the database is being queried so the user knows the query is processing.
    iii.	Change datepickers to a dropdown of discrete years
    iv.	Make sure query results match the queried fields
  c.	General
    i.	In interface to Litterfall entry, clear all button doesn’t restore the original state if there are banners (e.g. “Saved successfully”) at the top.
    ii.	Display of fields that are blank are inconsistently represented with n/a and -.  
    iii.	Error “Cannot read property Constructor” occasionally showing up on page load (129)
    iv.	Change the source of the species list to feed from the master list (master_species_info.json) (see 125) 
    v.	Fix floating point rounding errors (117)
    vi.	Figure out where the site list is populating from, because somehow Knoll is listed twice in some dropdowns (113)
    vii.	Ensure table sorting is working properly – had some issues with scope at one point (65)
    viii.	Floodplains site has 3 plots (as of 2011) – dropdowns need to reflect this.
    ix.	Make the table headers stay at the top of the page while scrolling down instead of letting them disappear up the page.
    x.	Check validation (negative values, maximum values from JLM for certain fields) to make sure it is working.
    xi.	When entering data, make sure that navigation away from the page first alerts the user that there are unsaved changes they will lose.
    xii.	Remove the save button from the entry pages – only keep the submit button.
    xiii.	Add an observation ID to the observation data ( or make an existing ID visibile in the table) so that submissions with errors can be referenced by ID rather than 
5.	Data download
  a.	Change the order of columns in the downloaded CSV file (13)
  b.	Add comment that in 2008, 2013 no data was collected (13)
  c.	Change header/column names in Tree data CSV (131)
  d.	Look into naming downloaded files by site/plot (e.g. Knoll2.csv)
  e.	If possible, download separate years to separate sheets or separate files.
  f.	CSV file seems to be downloading twice sometimes.
  g.  	Replace n/a with empty cells in download to aid in sorting.
  h.	Use yyyy as column headers in exported file instead of by observation number
  i.	Add status and notes fields to downloaded data
6.	Extensibility Issues
  a.	Check PC (?) issue about navigation buttons not properly working (83)
  b.	PC (?) export data button not consistently working (82)
7.	Database
  a.	Add indexes to common queries to speed them up (especially anything that feeds directly into the dropdown forms, or cache that information somewhere on the client side).

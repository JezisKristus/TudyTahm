using System.ComponentModel.DataAnnotations;


namespace TT_API.Models
{
    public class Marker
    {

        [Key]
        public int MarkerID { get; set; }
        public int IDUser { get; set; }
        public int IDPoint { get; set; }
        public int IDLabel { get; set; }
        public string MarkerName { get; set; }
        public string MarkerDescription { get; set; }
        public string MarkerIconPath { get; set; }

    }
}
